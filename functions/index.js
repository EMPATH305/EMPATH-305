'use strict';

const crypto = require('node:crypto');
const { createRateLimits } = require('./lib/rate-limits');
const { createAdminAccess } = require('./lib/admin-access');
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

const { requestIp, rateLimitKey, enforceSoulMaintenanceLimit, enforceRetentionMigrationLimit, enforceReportLimit, enforceContentSubmissionLimit, enforceContentDeletionLimit, enforceDriftLimit, enforceReactionLimit } = createRateLimits({
  db, HttpsError, FieldValue, Timestamp, RATE_LIMIT_SALT, REPORT_LIMIT_PER_HOUR, CONTENT_LIMIT_PER_HOUR, CONTENT_LIMIT_PER_TEN_MINUTES, CONTENT_DELETION_LIMIT_PER_HOUR, REACTION_LIMIT_PER_HOUR, SOUL_MAINTENANCE_LIMIT_PER_HOUR, RETENTION_MIGRATION_LIMIT_PER_HOUR
});

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

const adminAccess = createAdminAccess({ auth, HttpsError, ADMIN_EMAIL, logger });

exports.claimAdminRole = onCall({ secrets:[ADMIN_EMAIL], enforceAppCheck:false }, adminAccess.claimAdminRole);

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
