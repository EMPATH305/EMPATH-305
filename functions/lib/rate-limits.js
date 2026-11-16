'use strict';

const crypto = require('node:crypto');

function createRateLimits({
  db, HttpsError, FieldValue, Timestamp, RATE_LIMIT_SALT, REPORT_LIMIT_PER_HOUR, CONTENT_LIMIT_PER_HOUR, CONTENT_LIMIT_PER_TEN_MINUTES, CONTENT_DELETION_LIMIT_PER_HOUR, REACTION_LIMIT_PER_HOUR, SOUL_MAINTENANCE_LIMIT_PER_HOUR, RETENTION_MIGRATION_LIMIT_PER_HOUR
}) {
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

  return { requestIp, rateLimitKey, enforceSoulMaintenanceLimit, enforceRetentionMigrationLimit, enforceReportLimit, enforceContentSubmissionLimit, enforceContentDeletionLimit, enforceDriftLimit, enforceReactionLimit };
}

module.exports = { createRateLimits };
