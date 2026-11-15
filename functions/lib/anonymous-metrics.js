'use strict';

const { validateAnonymousClientInput } = require('./validation');

const SILENT_BUCKET_MS = 5 * 60 * 1000;
const SILENT_PARTICIPANTS_PER_SOURCE_BUCKET = 5;

function createAnonymousMetrics({ db, HttpsError, FieldValue, Timestamp, logger, anonymousParticipantKey, requestIp, rateLimitKey, RATE_LIMIT_SALT }) {
  async function joinSilentCompanionship(request) {
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
  }

  async function recordSiteVisit(request) {
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
  }

  return { joinSilentCompanionship, recordSiteVisit };
}

module.exports = { createAnonymousMetrics };
