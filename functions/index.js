'use strict';

const crypto = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldPath, FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const {
  ALLOWED_COLLECTIONS,
  validateRoomSubmissionInput,
  validateDriftLetterInput,
  validateDriftReceiveInput,
  containsCrisisSignal,
  validateReportInput,
  validateModerationInput,
  validateListReportsInput,
  summarizeTarget
} = require('./lib/validation');

initializeApp();
const db = getFirestore();
const auth = getAuth();
const ADMIN_EMAIL = defineSecret('ADMIN_EMAIL');
const RATE_LIMIT_SALT = defineSecret('RATE_LIMIT_SALT');
const REGION = 'asia-east1';
const REPORT_LIMIT_PER_HOUR = 8;
const CONTENT_LIMIT_PER_HOUR = 12;
// Six allows a visitor to complete all five rooms once without tripping the
// burst guard, while the hourly ceiling still blocks sustained flooding.
const CONTENT_LIMIT_PER_TEN_MINUTES = 6;
const DRIFT_SEND_LIMIT_PER_HOUR = 4;
const DRIFT_RECEIVE_LIMIT_PER_HOUR = 8;
const DRIFT_WAITING_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DRIFT_DELIVERED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Roll App Check out in stages: protect private moderation immediately while
// public reporting remains observable until embedded-browser compatibility is proven.
const ADMIN_APP_CHECK_ENFORCED = true;
const PUBLIC_REPORT_APP_CHECK_ENFORCED = false;

setGlobalOptions({ region:REGION, memory:'256MiB', timeoutSeconds:30, maxInstances:10 });

function requireAdmin(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in is required.');
  if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Admin access is required.');
  return request.auth.uid;
}

function requestIp(request) {
  const direct = request.rawRequest?.ip || request.rawRequest?.socket?.remoteAddress;
  if (direct) return String(direct);
  const forwarded = request.rawRequest?.headers?.['x-forwarded-for'];
  return Array.isArray(forwarded) ? String(forwarded[0]) : String(forwarded || 'unknown').split(',')[0].trim();
}

function rateLimitKey(request, salt) {
  return crypto.createHmac('sha256', salt).update(requestIp(request)).digest('hex').slice(0, 40);
}

async function enforceReportLimit(request) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const key = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const ref = db.collection('rate_limits').doc(`report_${hour}_${key}`);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Number(snapshot.data()?.count || 0) : 0;
    if (count >= REPORT_LIMIT_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Too many reports. Try again later.');
    }
    transaction.set(ref, {
      kind:'content-report',
      count:count + 1,
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis((hour + 2) * 3_600_000)
    }, { merge:true });
  });
}

async function enforceContentSubmissionLimit(request) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const tenMinutes = Math.floor(now / 600_000);
  const key = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const hourlyRef = db.collection('rate_limits').doc(`content_hour_${hour}_${key}`);
  const burstRef = db.collection('rate_limits').doc(`content_burst_${tenMinutes}_${key}`);

  await db.runTransaction(async transaction => {
    const [hourlySnapshot, burstSnapshot] = await Promise.all([
      transaction.get(hourlyRef),
      transaction.get(burstRef)
    ]);
    const hourlyCount = hourlySnapshot.exists ? Number(hourlySnapshot.data()?.count || 0) : 0;
    const burstCount = burstSnapshot.exists ? Number(burstSnapshot.data()?.count || 0) : 0;
    if (hourlyCount >= CONTENT_LIMIT_PER_HOUR || burstCount >= CONTENT_LIMIT_PER_TEN_MINUTES) {
      throw new HttpsError('resource-exhausted', 'Too many submissions. Try again later.');
    }
    const shared = {
      kind:'room-content',
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis((hour + 2) * 3_600_000)
    };
    transaction.set(hourlyRef, { ...shared, window:'hour', count:hourlyCount + 1 }, { merge:true });
    transaction.set(burstRef, { ...shared, window:'ten-minutes', count:burstCount + 1 }, { merge:true });
  });
}

function driftParticipantKey(clientId) {
  return crypto.createHmac('sha256', RATE_LIMIT_SALT.value())
    .update(`drift-participant:${clientId}`)
    .digest('hex')
    .slice(0, 40);
}

async function enforceDriftLimit(request, clientId, action, limit) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const source = `${requestIp(request)}:${clientId}`;
  const key = crypto.createHmac('sha256', RATE_LIMIT_SALT.value()).update(source).digest('hex').slice(0, 40);
  const ref = db.collection('rate_limits').doc(`drift_${action}_${hour}_${key}`);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Number(snapshot.data()?.count || 0) : 0;
    if (count >= limit) throw new HttpsError('resource-exhausted', 'Too many letter drift actions. Try again later.');
    transaction.set(ref, {
      kind:`drift-${action}`,
      count:count + 1,
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis((hour + 2) * 3_600_000)
    }, { merge:true });
  });
}

exports.claimAdminRole = onCall({ secrets:[ADMIN_EMAIL], enforceAppCheck:false }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in is required.');
  const tokenEmail = String(request.auth.token.email || '').trim().toLowerCase();
  const allowedEmail = ADMIN_EMAIL.value().trim().toLowerCase();
  if (!request.auth.token.email_verified || !tokenEmail || tokenEmail !== allowedEmail) {
    logger.warn('Rejected admin claim request', { uid:request.auth.uid });
    throw new HttpsError('permission-denied', 'This Google account is not an EMPATH administrator.');
  }
  const user = await auth.getUser(request.auth.uid);
  await auth.setCustomUserClaims(request.auth.uid, { ...(user.customClaims || {}), admin:true });
  logger.info('Granted EMPATH admin claim', { uid:request.auth.uid });
  return { granted:true };
});

exports.submitContentReport = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const report = validateReportInput(request.data);
  if (!report) throw new HttpsError('invalid-argument', 'Invalid report.');
  await enforceReportLimit(request);
  const target = await db.collection(report.targetCollection).doc(report.targetId).get();
  if (!target.exists) throw new HttpsError('not-found', 'The reported content no longer exists.');
  const result = await db.collection('content_reports').add({
    ...report,
    status:'open',
    appVerified:Boolean(request.app),
    createdAt:FieldValue.serverTimestamp()
  });
  logger.info('Anonymous content report created', {
    reportId:result.id,
    targetCollection:report.targetCollection,
    appVerified:Boolean(request.app)
  });
  return { accepted:true };
});

exports.submitRoomContent = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateRoomSubmissionInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid room submission.');
  await enforceContentSubmissionLimit(request);

  const collectionByRoom = {
    e:'emotions', m:'stars', p:'shards', a:'sand', t:'warmth'
  };
  const now = Date.now();
  const data = {
    createdAt:FieldValue.serverTimestamp(),
    appVerified:Boolean(request.app)
  };
  if (input.room === 'e') {
    if (input.text) data.text = input.text;
    if (input.image) data.image = input.image;
  } else if (input.room === 'm') {
    Object.assign(data, {
      text:input.text,
      brightness:1,
      clicks:0,
      colorIdx:crypto.randomInt(0, 6),
      relX:0.05 + (crypto.randomInt(0, 900_001) / 1_000_000),
      relY:0.05 + (crypto.randomInt(0, 900_001) / 1_000_000)
    });
  } else if (input.room === 'p') {
    Object.assign(data, { text:input.text, healed:false });
  } else if (input.room === 'a') {
    Object.assign(data, {
      text:input.text,
      absoluteTime:now,
      lifespan:input.lifespan,
      expireAt:Timestamp.fromMillis(now + input.lifespan)
    });
  } else {
    Object.assign(data, { text:input.text, echos:0 });
  }

  const contentRef = db.collection(collectionByRoom[input.room]).doc();
  if (input.room === 'a') {
    const statsRef = db.collection('metadata').doc('room_a_stats');
    await db.runTransaction(async transaction => {
      transaction.set(contentRef, data);
      transaction.set(statsRef, { totalReleased:FieldValue.increment(1) }, { merge:true });
    });
  } else {
    await contentRef.set(data);
  }
  logger.info('Anonymous room content created', {
    room:input.room,
    contentId:contentRef.id,
    appVerified:Boolean(request.app)
  });
  return { accepted:true, id:contentRef.id };
});

exports.sendDriftLetter = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateDriftLetterInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid drift letter.');
  if (containsCrisisSignal(input.text)) {
    throw new HttpsError('failed-precondition', 'Crisis content should stay in the private release path.');
  }
  await enforceDriftLimit(request, input.clientId, 'send', DRIFT_SEND_LIMIT_PER_HOUR);
  const now = Date.now();
  const result = await db.collection('drift_letters').add({
    text:input.text,
    status:'waiting',
    senderHash:driftParticipantKey(input.clientId),
    appVerified:Boolean(request.app),
    createdAt:FieldValue.serverTimestamp(),
    expiresAt:Timestamp.fromMillis(now + DRIFT_WAITING_TTL_MS)
  });
  logger.info('Anonymous drift letter released', { letterId:result.id, appVerified:Boolean(request.app) });
  return { accepted:true };
});

exports.receiveDriftLetter = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateDriftReceiveInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid drift receiver.');
  await enforceDriftLimit(request, input.clientId, 'receive', DRIFT_RECEIVE_LIMIT_PER_HOUR);
  const participantHash = driftParticipantKey(input.clientId);
  const waiting = await db.collection('drift_letters')
    .where('status', '==', 'waiting')
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();
  const candidates = waiting.docs.filter(item => item.data()?.senderHash !== participantHash);
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapWith = crypto.randomInt(0, index + 1);
    [candidates[index], candidates[swapWith]] = [candidates[swapWith], candidates[index]];
  }

  for (const candidate of candidates.slice(0, 8)) {
    try {
      const delivered = await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(candidate.ref);
        const data = snapshot.data();
        if (!snapshot.exists || data?.status !== 'waiting' || data?.senderHash === participantHash) return null;
        transaction.update(candidate.ref, {
          status:'delivered',
          recipientHash:participantHash,
          deliveredAt:FieldValue.serverTimestamp(),
          expiresAt:Timestamp.fromMillis(Date.now() + DRIFT_DELIVERED_TTL_MS)
        });
        return { id:snapshot.id, text:String(data.text || '').slice(0, 500) };
      });
      if (delivered) {
        logger.info('Anonymous drift letter delivered', { letterId:delivered.id, appVerified:Boolean(request.app) });
        return { available:true, ...delivered };
      }
    } catch (error) {
      logger.warn('Drift letter delivery contention', { letterId:candidate.id, error:String(error?.message || error) });
    }
  }
  return { available:false };
});

exports.listReports = onCall({ enforceAppCheck:ADMIN_APP_CHECK_ENFORCED }, async request => {
  requireAdmin(request);
  const { limit, cursor } = validateListReportsInput(request.data);
  let query = db.collection('content_reports')
    .where('status', '==', 'open')
    .orderBy('createdAt', 'desc')
    .orderBy(FieldPath.documentId(), 'desc');
  if (cursor) {
    query = query.startAfter(Timestamp.fromMillis(cursor.createdAt), cursor.id);
  }
  const snapshot = await query.limit(limit + 1).get();
  const hasMore = snapshot.docs.length > limit;
  const pageDocs = snapshot.docs.slice(0, limit);
  const reports = await Promise.all(pageDocs.map(async item => {
    const data = item.data();
    const targetCollection = ALLOWED_COLLECTIONS.has(data.targetCollection) ? data.targetCollection : '';
    const targetId = typeof data.targetId === 'string' ? data.targetId : '';
    let targetExists = false;
    let preview = '';
    if (targetCollection && targetId) {
      const target = await db.collection(targetCollection).doc(targetId).get();
      targetExists = target.exists;
      preview = target.exists ? summarizeTarget(target.data()) : '[content already removed]';
    }
    return {
      id:item.id,
      targetCollection,
      targetId,
      reason:String(data.reason || 'other'),
      createdAt:data.createdAt?.toMillis?.() || null,
      appVerified:Boolean(data.appVerified),
      targetExists,
      preview
    };
  }));
  const last = pageDocs.at(-1);
  return {
    reports,
    hasMore,
    nextCursor:hasMore && last ? {
      id:last.id,
      createdAt:last.data().createdAt?.toMillis?.() || null
    } : null,
    security:{
      appCheckVerified:Boolean(request.app),
      appCheckEnforced:ADMIN_APP_CHECK_ENFORCED
    }
  };
});

exports.moderateReport = onCall({ enforceAppCheck:ADMIN_APP_CHECK_ENFORCED }, async request => {
  const moderatorUid = requireAdmin(request);
  const input = validateModerationInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid moderation action.');
  const reportRef = db.collection('content_reports').doc(input.reportId);
  const auditRef = db.collection('moderation_audit').doc();
  await db.runTransaction(async transaction => {
    const reportSnapshot = await transaction.get(reportRef);
    if (!reportSnapshot.exists) throw new HttpsError('not-found', 'Report not found.');
    const report = reportSnapshot.data();
    if ((report.status || 'open') !== 'open') {
      throw new HttpsError('failed-precondition', 'This report has already been reviewed.');
    }
    if (input.action === 'remove') {
      if (!ALLOWED_COLLECTIONS.has(report.targetCollection) || typeof report.targetId !== 'string') {
        throw new HttpsError('failed-precondition', 'The report target is invalid.');
      }
      transaction.delete(db.collection(report.targetCollection).doc(report.targetId));
    }
    transaction.update(reportRef, {
      status:input.action === 'remove' ? 'removed' : 'dismissed',
      moderationAction:input.action,
      moderatedAt:FieldValue.serverTimestamp(),
      moderatorUid
    });
    transaction.set(auditRef, {
      reportId:input.reportId,
      action:input.action,
      targetCollection:String(report.targetCollection || ''),
      targetId:String(report.targetId || ''),
      moderatorUid,
      createdAt:FieldValue.serverTimestamp()
    });
  });
  logger.info('Content report moderated', { reportId:input.reportId, action:input.action, moderatorUid });
  return { completed:true };
});
