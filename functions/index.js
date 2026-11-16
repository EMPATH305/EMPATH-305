'use strict';

const crypto = require('node:crypto');
const { createContentReports } = require('./lib/content-reports');
const { createRetentionMigrations } = require('./lib/retention-migrations');
const { createModeration } = require('./lib/moderation');
const { createRoomSubmission } = require('./lib/room-submission');
const { createRoomReactions } = require('./lib/room-reactions');
const { createContentWithdrawal } = require('./lib/content-withdrawal');
const { createAnonymousMetrics } = require('./lib/anonymous-metrics');
const { createDriftLetters } = require('./lib/drift-letters');
const { createSoulMaintenance } = require('./lib/soul-maintenance');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldPath, FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { createCallableTelemetry } = require('./lib/callable-telemetry');
const { ALLOWED_COLLECTIONS } = require('./lib/validation');

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
const REACTION_LIMIT_PER_HOUR = 40;
const SOUL_MAINTENANCE_LIMIT_PER_HOUR = 8;
const RETENTION_MIGRATION_LIMIT_PER_HOUR = 4;
const PUBLIC_CONTENT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const CONTENT_REPORT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const MODERATION_AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;
// Roll App Check out in stages: protect private moderation immediately while
// public reporting remains observable until embedded-browser compatibility is proven.
const ADMIN_APP_CHECK_ENFORCED = true;
const PUBLIC_APP_CHECK_ENFORCEMENT = Object.freeze({
  submitContentReport:false,
  submitRoomContent:false,
  deleteRoomContent:false,
  reactToRoomContent:false,
  joinSilentCompanionship:false,
  recordSiteVisit:false,
  initializePublicRetention:false,
  initializeModerationRetention:false,
  retireLegacySoulJourney:false,
  deleteSoulJourney:false,
  sendDriftLetter:false,
  receiveDriftLetter:false
});

const withCallableTelemetry = createCallableTelemetry(logger);

function observedOnCall(functionName, options, handler) {
  return onCall(
    options,
    withCallableTelemetry(functionName, options?.enforceAppCheck === true, handler)
  );
}

setGlobalOptions({ region:REGION, memory:'256MiB', timeoutSeconds:30, maxInstances:10 });

function requestIp(request) {
  const direct = request.rawRequest?.ip || request.rawRequest?.socket?.remoteAddress;
  if (direct) return String(direct);
  const forwarded = request.rawRequest?.headers?.['x-forwarded-for'];
  return Array.isArray(forwarded) ? String(forwarded[0]) : String(forwarded || 'unknown').split(',')[0].trim();
}

function rateLimitKey(request, salt) {
  return crypto.createHmac('sha256', salt).update(requestIp(request)).digest('hex').slice(0, 40);
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

const contentReports = createContentReports({
  db, HttpsError, FieldValue, Timestamp, logger, enforceReportLimit, CONTENT_REPORT_RETENTION_MS
});

exports.submitContentReport = observedOnCall('submitContentReport', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.submitContentReport
}, contentReports.submitContentReport);

const roomSubmission = createRoomSubmission({
  db, HttpsError, FieldValue, Timestamp, logger, enforceContentSubmissionLimit,
  RATE_LIMIT_SALT, PUBLIC_CONTENT_RETENTION_MS, contentDeletionReceiptId,
  contentDeletionTokenHash, tokenHashesMatch
});

exports.submitRoomContent = observedOnCall('submitRoomContent', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.submitRoomContent
}, roomSubmission.submitRoomContent);

const contentWithdrawal = createContentWithdrawal({
  db, HttpsError, logger, enforceContentDeletionLimit,
  contentDeletionReceiptId, contentDeletionTokenHash, tokenHashesMatch
});

exports.deleteRoomContent = observedOnCall('deleteRoomContent', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.deleteRoomContent
}, contentWithdrawal.deleteRoomContent);

const roomReactions = createRoomReactions({
  db, HttpsError, FieldValue, Timestamp, logger, enforceReactionLimit, rateLimitKey, RATE_LIMIT_SALT
});

exports.reactToRoomContent = observedOnCall('reactToRoomContent', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.reactToRoomContent
}, roomReactions.reactToRoomContent);

const anonymousMetrics = createAnonymousMetrics({
  db, HttpsError, FieldValue, Timestamp, logger, anonymousParticipantKey,
  requestIp, rateLimitKey, RATE_LIMIT_SALT
});

exports.joinSilentCompanionship = observedOnCall('joinSilentCompanionship', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.joinSilentCompanionship
}, anonymousMetrics.joinSilentCompanionship);

exports.recordSiteVisit = observedOnCall('recordSiteVisit', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.recordSiteVisit
}, anonymousMetrics.recordSiteVisit);

const retentionMigrations = createRetentionMigrations({
  db, HttpsError, FieldValue, Timestamp, logger, enforceRetentionMigrationLimit,
  PUBLIC_CONTENT_RETENTION_MS, CONTENT_REPORT_RETENTION_MS, MODERATION_AUDIT_RETENTION_MS
});

exports.initializePublicRetention = observedOnCall('initializePublicRetention', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.initializePublicRetention,
  timeoutSeconds:120,
  memory:'512MiB'
}, retentionMigrations.initializePublicRetention);

exports.initializeModerationRetention = observedOnCall('initializeModerationRetention', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.initializeModerationRetention,
  timeoutSeconds:120,
  memory:'512MiB'
}, retentionMigrations.initializeModerationRetention);

const soulMaintenance = createSoulMaintenance({
  db, HttpsError, logger, enforceSoulMaintenanceLimit
});

exports.retireLegacySoulJourney = observedOnCall('retireLegacySoulJourney', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.retireLegacySoulJourney
}, soulMaintenance.retireLegacySoulJourney);

exports.deleteSoulJourney = observedOnCall('deleteSoulJourney', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.deleteSoulJourney
}, soulMaintenance.deleteSoulJourney);

const driftLetters = createDriftLetters({
  db, HttpsError, FieldValue, Timestamp, logger, enforceDriftLimit, driftParticipantKey
});

exports.sendDriftLetter = observedOnCall('sendDriftLetter', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.sendDriftLetter
}, driftLetters.sendDriftLetter);

exports.receiveDriftLetter = observedOnCall('receiveDriftLetter', {
  secrets:[RATE_LIMIT_SALT],
  enforceAppCheck:PUBLIC_APP_CHECK_ENFORCEMENT.receiveDriftLetter
}, driftLetters.receiveDriftLetter);

const moderation = createModeration({
  db, HttpsError, FieldPath, FieldValue, Timestamp, logger,
  ADMIN_APP_CHECK_ENFORCED, MODERATION_AUDIT_RETENTION_MS
});

exports.listReports = onCall({ enforceAppCheck:ADMIN_APP_CHECK_ENFORCED }, moderation.listReports);

exports.moderateReport = onCall({ enforceAppCheck:ADMIN_APP_CHECK_ENFORCED }, moderation.moderateReport);
