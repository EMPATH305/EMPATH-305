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
  validateRoomReactionInput,
  validateContentDeletionInput,
  validateAnonymousClientInput,
  validateSoulKeyInput,
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
const CONTENT_DELETION_LIMIT_PER_HOUR = 10;
const DRIFT_SEND_LIMIT_PER_HOUR = 4;
const DRIFT_RECEIVE_LIMIT_PER_HOUR = 8;
const REACTION_LIMIT_PER_HOUR = 40;
const REACTION_RECEIPT_TTL_MS = 48 * 60 * 60 * 1000;
const CONSTELLATION_TTL_MS = 24 * 60 * 60 * 1000;
const SILENT_BUCKET_MS = 5 * 60 * 1000;
const SILENT_PARTICIPANTS_PER_SOURCE_BUCKET = 5;
const SOUL_MAINTENANCE_LIMIT_PER_HOUR = 8;
const RETENTION_MIGRATION_LIMIT_PER_HOUR = 4;
const PUBLIC_CONTENT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const CONTENT_REPORT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const MODERATION_AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
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

function soulStorageId(soulKey) {
  return `sj_${crypto.createHash('sha256').update(`EMPATH-SOUL-ID:${soulKey}`).digest('hex')}`;
}

async function enforceSoulMaintenanceLimit(request) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const key = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const ref = db.collection('rate_limits').doc(`soul_maintenance_${hour}_${key}`);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Math.max(0, Number(snapshot.data()?.count) || 0) : 0;
    if (count >= SOUL_MAINTENANCE_LIMIT_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Too many Soul backup requests. Try again later.');
    }
    transaction.set(ref, {
      kind:'soul-maintenance',
      count:count + 1,
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis((hour + 2) * 3_600_000)
    }, { merge:true });
  });
}

async function enforceRetentionMigrationLimit(request) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const key = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const ref = db.collection('rate_limits').doc(`retention_migration_${hour}_${key}`);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Math.max(0, Number(snapshot.data()?.count) || 0) : 0;
    if (count >= RETENTION_MIGRATION_LIMIT_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Too many retention migration requests. Try again later.');
    }
    transaction.set(ref, {
      kind:'retention-migration',
      count:count + 1,
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis((hour + 2) * 3_600_000)
    }, { merge:true });
  });
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

async function enforceContentDeletionLimit(request) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const key = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const ref = db.collection('rate_limits').doc(`content_deletion_${hour}_${key}`);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Math.max(0, Number(snapshot.data()?.count) || 0) : 0;
    if (count >= CONTENT_DELETION_LIMIT_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Too many withdrawal requests. Try again later.');
    }
    transaction.set(ref, {
      kind:'content-deletion',
      count:count + 1,
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis((hour + 2) * 3_600_000)
    }, { merge:true });
  });
}

function contentDeletionReceiptId(targetCollection, targetId) {
  return crypto.createHash('sha256')
    .update(`content-deletion-receipt:${targetCollection}:${targetId}`)
    .digest('hex');
}

function contentDeletionTokenHash(targetCollection, targetId, deletionToken) {
  return crypto.createHmac('sha256', RATE_LIMIT_SALT.value())
    .update(`content-deletion-token:${targetCollection}:${targetId}:${deletionToken}`)
    .digest('hex');
}

function tokenHashesMatch(expected, actual) {
  if (!/^[a-f0-9]{64}$/.test(String(expected)) || !/^[a-f0-9]{64}$/.test(String(actual))) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
}

function driftParticipantKey(clientId) {
  return crypto.createHmac('sha256', RATE_LIMIT_SALT.value())
    .update(`drift-participant:${clientId}`)
    .digest('hex')
    .slice(0, 40);
}

function anonymousParticipantKey(namespace, value) {
  return crypto.createHmac('sha256', RATE_LIMIT_SALT.value())
    .update(`${namespace}:${value}`)
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

async function enforceReactionLimit(request) {
  const now = Date.now();
  const hour = Math.floor(now / 3_600_000);
  const key = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const ref = db.collection('rate_limits').doc(`reaction_hour_${hour}_${key}`);
  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = snapshot.exists ? Math.max(0, Number(snapshot.data()?.count) || 0) : 0;
    if (count >= REACTION_LIMIT_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Too many reactions. Try again later.');
    }
    transaction.set(ref, {
      kind:'room-reaction',
      window:'hour',
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
  const now = Date.now();
  const target = await db.collection(report.targetCollection).doc(report.targetId).get();
  if (!target.exists) throw new HttpsError('not-found', 'The reported content no longer exists.');
  const result = await db.collection('content_reports').add({
    ...report,
    status:'open',
    appVerified:Boolean(request.app),
    createdAt:FieldValue.serverTimestamp(),
    expireAt:Timestamp.fromMillis(now + CONTENT_REPORT_RETENTION_MS)
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
  if (input.room !== 'a') {
    data.expireAt = Timestamp.fromMillis(now + PUBLIC_CONTENT_RETENTION_MS);
  }
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
  let roomStats = null;
  let deletionToken = null;
  let deletionExpiresAt = null;
  if (input.room === 'a') {
    const statsRef = db.collection('metadata').doc('room_a_stats');
    await db.runTransaction(async transaction => {
      const statsSnapshot = await transaction.get(statsRef);
      const existingStats = statsSnapshot.exists ? statsSnapshot.data() : {};
      const totalReleased = Math.max(0, Number(existingStats?.totalReleased) || 0) + 1;
      const kindCounts = Object.fromEntries(
        ['relationship', 'loss', 'self', 'future', 'unnamed'].map(kind => [
          kind,
          Math.max(0, Number(existingStats?.kindCounts?.[kind]) || 0)
        ])
      );
      kindCounts[input.weightKind] += 1;
      transaction.set(contentRef, data);
      transaction.set(statsRef, { totalReleased, kindCounts }, { merge:true });
      roomStats = {
        totalReleased,
        sameKind:kindCounts[input.weightKind],
        weightKind:input.weightKind
      };
    });
  } else {
    const publicStatsRef = db.collection('metadata').doc('public_room_stats');
    const statsFieldByRoom = { e:'emotions', m:'stars', p:'shards', t:'warmth' };
    deletionToken = crypto.randomBytes(32).toString('base64url');
    deletionExpiresAt = now + PUBLIC_CONTENT_RETENTION_MS;
    const receiptRef = db.collection('content_deletion_receipts').doc(
      contentDeletionReceiptId(contentRef.parent.id, contentRef.id)
    );
    await db.runTransaction(async transaction => {
      transaction.set(contentRef, data);
      transaction.set(receiptRef, {
        targetCollection:contentRef.parent.id,
        targetId:contentRef.id,
        tokenHash:contentDeletionTokenHash(contentRef.parent.id, contentRef.id, deletionToken),
        createdAt:FieldValue.serverTimestamp(),
        expiresAt:Timestamp.fromMillis(deletionExpiresAt)
      });
      transaction.set(publicStatsRef, {
        [statsFieldByRoom[input.room]]:FieldValue.increment(1),
        updatedAt:FieldValue.serverTimestamp()
      }, { merge:true });
    });
  }
  logger.info('Anonymous room content created', {
    room:input.room,
    contentId:contentRef.id,
    appVerified:Boolean(request.app)
  });
  return {
    accepted:true,
    id:contentRef.id,
    ...(deletionToken ? { deletionToken, deletionExpiresAt } : {}),
    ...(roomStats ? { roomStats } : {})
  };
});

exports.deleteRoomContent = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateContentDeletionInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid content withdrawal request.');
  await enforceContentDeletionLimit(request);

  const receiptRef = db.collection('content_deletion_receipts').doc(
    contentDeletionReceiptId(input.targetCollection, input.targetId)
  );
  const contentRef = db.collection(input.targetCollection).doc(input.targetId);
  let deleted = false;
  await db.runTransaction(async transaction => {
    const [receiptSnapshot, contentSnapshot] = await Promise.all([
      transaction.get(receiptRef),
      transaction.get(contentRef)
    ]);
    if (!receiptSnapshot.exists) {
      throw new HttpsError('not-found', 'This withdrawal receipt is unavailable or expired.');
    }
    const receipt = receiptSnapshot.data() || {};
    const expiresAt = receipt.expiresAt?.toMillis?.() || 0;
    if (receipt.targetCollection !== input.targetCollection
        || receipt.targetId !== input.targetId
        || expiresAt <= Date.now()) {
      throw new HttpsError('not-found', 'This withdrawal receipt is unavailable or expired.');
    }
    const suppliedHash = contentDeletionTokenHash(
      input.targetCollection, input.targetId, input.deletionToken
    );
    if (!tokenHashesMatch(receipt.tokenHash, suppliedHash)) {
      throw new HttpsError('permission-denied', 'The withdrawal receipt does not match this content.');
    }
    deleted = contentSnapshot.exists;
    if (deleted) transaction.delete(contentRef);
    transaction.delete(receiptRef);
  });
  logger.info('Anonymous room content withdrawn', {
    targetCollection:input.targetCollection,
    targetId:input.targetId,
    deleted,
    appVerified:Boolean(request.app)
  });
  return { completed:true, deleted };
});

exports.reactToRoomContent = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateRoomReactionInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid room reaction.');
  await enforceReactionLimit(request);

  const targets = {
    star:{ collection:'stars' },
    shard:{ collection:'shards' },
    warmth:{ collection:'warmth' }
  };
  const target = targets[input.kind];
  const now = Date.now();
  const participantHash = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const targetHash = crypto.createHash('sha256')
    .update(`${input.kind}:${input.targetId}`)
    .digest('hex')
    .slice(0, 24);
  const contentRef = db.collection(target.collection).doc(input.targetId);
  const publicStatsRef = db.collection('metadata').doc('public_room_stats');
  const neighborRefs = (input.neighborIds || []).map(id => db.collection('stars').doc(id));
  const constellationRefs = neighborRefs.map(() => db.collection('constellations').doc());
  const receiptRef = db.collection('rate_limits')
    .doc(`reaction_${input.kind}_${targetHash}_${participantHash}`);
  let reactionResult = null;

  await db.runTransaction(async transaction => {
    const [contentSnapshot, receiptSnapshot, ...neighborSnapshots] = await Promise.all([
      transaction.get(contentRef),
      transaction.get(receiptRef),
      ...neighborRefs.map(ref => transaction.get(ref))
    ]);
    if (!contentSnapshot.exists) throw new HttpsError('not-found', 'Content no longer exists.');
    const receiptExpiry = receiptSnapshot.data()?.expiresAt?.toMillis?.() || 0;
    if (receiptSnapshot.exists && receiptExpiry > now) {
      throw new HttpsError('already-exists', 'This reaction was already counted.');
    }

    const content = contentSnapshot.data() || {};
    if (input.kind === 'star') {
      const clicks = Math.min(Math.max(0, Number(content.clicks) || 0) + 1, 1_000_000);
      const brightness = Math.min(Math.max(1, Number(content.brightness) || 1) + 1, 12);
      transaction.update(contentRef, { clicks, brightness });
      const connectedIds = [];
      neighborSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists) return;
        const neighborId = neighborRefs[index].id;
        transaction.set(constellationRefs[index], {
          s1Id:input.targetId,
          s2Id:neighborId,
          createdAt:FieldValue.serverTimestamp(),
          expiresAt:Timestamp.fromMillis(now + CONSTELLATION_TTL_MS)
        });
        connectedIds.push(neighborId);
      });
      reactionResult = { clicks, brightness, connectedIds };
    } else if (input.kind === 'shard') {
      const healed = content.healed === true;
      if (!healed) {
        transaction.update(contentRef, { healed:true });
        transaction.set(publicStatsRef, {
          healedShards:FieldValue.increment(1),
          updatedAt:FieldValue.serverTimestamp()
        }, { merge:true });
      }
      reactionResult = { healed:true, changed:!healed };
    } else {
      const echos = Math.min(Math.max(0, Number(content.echos) || 0) + 1, 1_000_000);
      transaction.update(contentRef, { echos });
      reactionResult = { echos };
    }

    transaction.set(receiptRef, {
      kind:`reaction-${input.kind}`,
      count:1,
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis(now + REACTION_RECEIPT_TTL_MS)
    });
  });

  logger.info('Anonymous room reaction accepted', {
    kind:input.kind,
    targetId:input.targetId,
    appVerified:Boolean(request.app)
  });
  return { accepted:true, ...reactionResult };
});

exports.joinSilentCompanionship = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateAnonymousClientInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid silent companionship participant.');
  const now = Date.now();
  const bucket = Math.floor(now / SILENT_BUCKET_MS);
  const participantHash = anonymousParticipantKey('silent-participant', `${requestIp(request)}:${input.clientId}`);
  const sourceHash = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const presenceRef = db.collection('metadata').doc('silent_presence');
  const receiptRef = db.collection('rate_limits').doc(`silent_receipt_${bucket}_${participantHash}`);
  const sourceRef = db.collection('rate_limits').doc(`silent_source_${bucket}_${sourceHash}`);
  let result = null;

  await db.runTransaction(async transaction => {
    const [presenceSnapshot, receiptSnapshot, sourceSnapshot] = await Promise.all([
      transaction.get(presenceRef),
      transaction.get(receiptRef),
      transaction.get(sourceRef)
    ]);
    const current = presenceSnapshot.data() || {};
    const currentCount = Number(current.bucket) === bucket
      ? Math.min(100_000, Math.max(0, Number(current.count) || 0))
      : 0;
    const receiptExpiry = receiptSnapshot.data()?.expiresAt?.toMillis?.() || 0;
    if (receiptSnapshot.exists && receiptExpiry > now) {
      result = { count:Math.max(1, currentCount), bucket, counted:false };
      return;
    }
    const sourceCount = sourceSnapshot.exists ? Math.max(0, Number(sourceSnapshot.data()?.count) || 0) : 0;
    if (sourceCount >= SILENT_PARTICIPANTS_PER_SOURCE_BUCKET) {
      throw new HttpsError('resource-exhausted', 'Too many silent companionship joins from this source.');
    }
    const count = Math.min(100_000, currentCount + 1);
    const expiresAt = Timestamp.fromMillis((bucket + 2) * SILENT_BUCKET_MS);
    transaction.set(presenceRef, { bucket, count, updatedAt:FieldValue.serverTimestamp() });
    transaction.set(receiptRef, {
      kind:'silent-companionship-receipt', count:1,
      updatedAt:FieldValue.serverTimestamp(), expiresAt
    });
    transaction.set(sourceRef, {
      kind:'silent-companionship-source', count:sourceCount + 1,
      updatedAt:FieldValue.serverTimestamp(), expiresAt
    }, { merge:true });
    result = { count, bucket, counted:true };
  });

  logger.info('Silent companionship joined', {
    bucket,
    counted:result?.counted === true,
    appVerified:Boolean(request.app)
  });
  return { accepted:true, ...result };
});

exports.recordSiteVisit = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const now = Date.now();
  const day = Math.floor(now / 86_400_000);
  const sourceHash = rateLimitKey(request, RATE_LIMIT_SALT.value());
  const statsRef = db.collection('metadata').doc('site_stats');
  const receiptRef = db.collection('rate_limits').doc(`site_visit_${day}_${sourceHash}`);
  let result = null;

  await db.runTransaction(async transaction => {
    const [statsSnapshot, receiptSnapshot] = await Promise.all([
      transaction.get(statsRef),
      transaction.get(receiptRef)
    ]);
    const totalVisitors = Math.min(10_000_000, Math.max(0, Number(statsSnapshot.data()?.totalVisitors) || 0));
    const receiptExpiry = receiptSnapshot.data()?.expiresAt?.toMillis?.() || 0;
    if (receiptSnapshot.exists && receiptExpiry > now) {
      result = { totalVisitors, counted:false };
      return;
    }
    const nextTotal = Math.min(10_000_000, totalVisitors + 1);
    transaction.set(statsRef, { totalVisitors:nextTotal }, { merge:true });
    transaction.set(receiptRef, {
      kind:'site-visit', count:1,
      updatedAt:FieldValue.serverTimestamp(),
      expiresAt:Timestamp.fromMillis((day + 2) * 86_400_000)
    });
    result = { totalVisitors:nextTotal, counted:true };
  });

  logger.info('Anonymous site visit recorded', {
    counted:result?.counted === true,
    appVerified:Boolean(request.app)
  });
  return { accepted:true, ...result };
});

exports.initializePublicRetention = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED,
  timeoutSeconds:120,
  memory:'512MiB'
}, async request => {
  if (request.data?.migrationId !== 'public-retention-v1') {
    throw new HttpsError('invalid-argument', 'Invalid retention migration request.');
  }
  await enforceRetentionMigrationLimit(request);
  const now = Date.now();
  const markerRef = db.collection('metadata').doc('public_retention_v1');
  const statsRef = db.collection('metadata').doc('public_room_stats');
  let alreadyCompleted = false;
  await db.runTransaction(async transaction => {
    const markerSnapshot = await transaction.get(markerRef);
    const marker = markerSnapshot.data() || {};
    if (marker.completed === true) {
      alreadyCompleted = true;
      return;
    }
    const lockUntil = marker.lockUntil?.toMillis?.() || 0;
    if (lockUntil > now) {
      throw new HttpsError('resource-exhausted', 'Retention migration is already running.');
    }
    transaction.set(markerRef, {
      completed:false,
      lockUntil:Timestamp.fromMillis(now + 5 * 60 * 1000),
      updatedAt:FieldValue.serverTimestamp()
    }, { merge:true });
  });
  if (alreadyCompleted) {
    const statsSnapshot = await statsRef.get();
    return { completed:true, alreadyCompleted:true, stats:statsSnapshot.data() || {} };
  }

  const collections = ['emotions', 'stars', 'shards', 'warmth'];
  const snapshots = {};
  for (const collectionName of collections) {
    snapshots[collectionName] = await db.collection(collectionName)
      .select('createdAt', 'expireAt', 'healed')
      .get();
  }

  const writer = db.bulkWriter();
  let backfilled = 0;
  for (const collectionName of collections) {
    snapshots[collectionName].forEach(documentSnapshot => {
      const data = documentSnapshot.data() || {};
      if (data.expireAt?.toMillis?.()) return;
      const createdAt = data.createdAt?.toMillis?.() || now;
      writer.update(documentSnapshot.ref, {
        expireAt:Timestamp.fromMillis(createdAt + PUBLIC_CONTENT_RETENTION_MS)
      });
      backfilled += 1;
    });
  }
  await writer.close();

  const stats = {
    emotions:snapshots.emotions.size,
    stars:snapshots.stars.size,
    shards:snapshots.shards.size,
    healedShards:snapshots.shards.docs.filter(documentSnapshot => documentSnapshot.data()?.healed === true).length,
    warmth:snapshots.warmth.size
  };
  await db.runTransaction(async transaction => {
    transaction.set(statsRef, {
      ...stats,
      initializedAt:FieldValue.serverTimestamp(),
      updatedAt:FieldValue.serverTimestamp()
    });
    transaction.set(markerRef, {
      completed:true,
      backfilled,
      completedAt:FieldValue.serverTimestamp(),
      updatedAt:FieldValue.serverTimestamp(),
      lockUntil:FieldValue.delete()
    }, { merge:true });
  });
  logger.info('Public content retention initialized', { backfilled, stats });
  return { completed:true, alreadyCompleted:false, backfilled, stats };
});

exports.initializeModerationRetention = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED,
  timeoutSeconds:120,
  memory:'512MiB'
}, async request => {
  if (request.data?.migrationId !== 'moderation-retention-v1') {
    throw new HttpsError('invalid-argument', 'Invalid moderation retention migration request.');
  }
  await enforceRetentionMigrationLimit(request);
  const now = Date.now();
  const markerRef = db.collection('metadata').doc('moderation_retention_v1');
  let alreadyCompleted = false;
  await db.runTransaction(async transaction => {
    const markerSnapshot = await transaction.get(markerRef);
    const marker = markerSnapshot.data() || {};
    if (marker.completed === true) {
      alreadyCompleted = true;
      return;
    }
    const lockUntil = marker.lockUntil?.toMillis?.() || 0;
    if (lockUntil > now) {
      throw new HttpsError('resource-exhausted', 'Moderation retention migration is already running.');
    }
    transaction.set(markerRef, {
      completed:false,
      lockUntil:Timestamp.fromMillis(now + 5 * 60 * 1000),
      updatedAt:FieldValue.serverTimestamp()
    }, { merge:true });
  });
  if (alreadyCompleted) return { completed:true, alreadyCompleted:true };

  const retentionByCollection = {
    content_reports:CONTENT_REPORT_RETENTION_MS,
    moderation_audit:MODERATION_AUDIT_RETENTION_MS
  };
  const writer = db.bulkWriter();
  const backfilled = { contentReports:0, moderationAudit:0 };
  for (const [collectionName, retentionMs] of Object.entries(retentionByCollection)) {
    const snapshot = await db.collection(collectionName).select('createdAt', 'expireAt').get();
    snapshot.forEach(documentSnapshot => {
      const data = documentSnapshot.data() || {};
      if (data.expireAt?.toMillis?.()) return;
      const createdAt = data.createdAt?.toMillis?.() || now;
      writer.update(documentSnapshot.ref, {
        expireAt:Timestamp.fromMillis(createdAt + retentionMs)
      });
      if (collectionName === 'content_reports') backfilled.contentReports += 1;
      else backfilled.moderationAudit += 1;
    });
  }
  await writer.close();
  await markerRef.set({
    completed:true,
    backfilled,
    completedAt:FieldValue.serverTimestamp(),
    updatedAt:FieldValue.serverTimestamp(),
    lockUntil:FieldValue.delete()
  }, { merge:true });
  logger.info('Moderation retention initialized', backfilled);
  return { completed:true, alreadyCompleted:false, backfilled };
});

exports.retireLegacySoulJourney = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateSoulKeyInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid Soul Key.');
  await enforceSoulMaintenanceLimit(request);
  const encryptedRef = db.collection('user_journeys').doc(soulStorageId(input.soulKey));
  const legacyRef = db.collection('user_journeys').doc(input.soulKey);
  let retired = false;
  await db.runTransaction(async transaction => {
    const [encryptedSnapshot, legacySnapshot] = await Promise.all([
      transaction.get(encryptedRef),
      transaction.get(legacyRef)
    ]);
    const encrypted = encryptedSnapshot.data() || {};
    if (!encryptedSnapshot.exists || encrypted.schemaVersion !== 3 || typeof encrypted.ciphertext !== 'string') {
      throw new HttpsError('failed-precondition', 'Encrypted Soul backup must exist before legacy data is retired.');
    }
    if (legacySnapshot.exists) {
      transaction.delete(legacyRef);
      retired = true;
    }
  });
  logger.info('Legacy Soul journey retired', {
    storageId:soulStorageId(input.soulKey),
    retired,
    appVerified:Boolean(request.app)
  });
  return { completed:true, retired };
});

exports.deleteSoulJourney = onCall({
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_REPORT_APP_CHECK_ENFORCED
}, async request => {
  const input = validateSoulKeyInput(request.data);
  if (!input) throw new HttpsError('invalid-argument', 'Invalid Soul Key.');
  await enforceSoulMaintenanceLimit(request);
  const encryptedRef = db.collection('user_journeys').doc(soulStorageId(input.soulKey));
  const legacyRef = db.collection('user_journeys').doc(input.soulKey);
  let encryptedDeleted = false;
  let legacyDeleted = false;
  await db.runTransaction(async transaction => {
    const [encryptedSnapshot, legacySnapshot] = await Promise.all([
      transaction.get(encryptedRef),
      transaction.get(legacyRef)
    ]);
    encryptedDeleted = encryptedSnapshot.exists;
    legacyDeleted = legacySnapshot.exists;
    if (encryptedDeleted) transaction.delete(encryptedRef);
    if (legacyDeleted) transaction.delete(legacyRef);
  });
  logger.info('Soul journey deleted by key holder', {
    storageId:soulStorageId(input.soulKey),
    encryptedDeleted,
    legacyDeleted,
    appVerified:Boolean(request.app)
  });
  return { completed:true, deleted:encryptedDeleted || legacyDeleted };
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
      createdAt:FieldValue.serverTimestamp(),
      expireAt:Timestamp.fromMillis(Date.now() + MODERATION_AUDIT_RETENTION_MS)
    });
  });
  logger.info('Content report moderated', { reportId:input.reportId, action:input.action, moderatorUid });
  return { completed:true };
});
