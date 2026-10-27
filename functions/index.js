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
