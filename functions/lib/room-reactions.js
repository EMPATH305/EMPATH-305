'use strict';

const crypto = require('node:crypto');
const { validateRoomReactionInput } = require('./validation');

const REACTION_RECEIPT_TTL_MS = 48 * 60 * 60 * 1000;
const CONSTELLATION_TTL_MS = 24 * 60 * 60 * 1000;

function createRoomReactions({ db, HttpsError, FieldValue, Timestamp, logger, enforceReactionLimit, rateLimitKey, RATE_LIMIT_SALT }) {
  async function reactToRoomContent(request) {
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
  }

  return { reactToRoomContent };
}

module.exports = { createRoomReactions };
