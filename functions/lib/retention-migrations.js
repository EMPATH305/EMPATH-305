'use strict';

function createRetentionMigrations({ db, HttpsError, FieldValue, Timestamp, logger, enforceRetentionMigrationLimit, PUBLIC_CONTENT_RETENTION_MS, CONTENT_REPORT_RETENTION_MS, MODERATION_AUDIT_RETENTION_MS }) {
  async function initializePublicRetention(request) {
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
  }

  async function initializeModerationRetention(request) {
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
  }

  return { initializePublicRetention, initializeModerationRetention };
}

module.exports = { createRetentionMigrations };
