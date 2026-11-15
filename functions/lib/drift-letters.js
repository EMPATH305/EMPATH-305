'use strict';

const crypto = require('node:crypto');
const { validateDriftLetterInput, validateDriftReceiveInput, containsCrisisSignal } = require('./validation');

const DRIFT_SEND_LIMIT_PER_HOUR = 4;
const DRIFT_RECEIVE_LIMIT_PER_HOUR = 8;
const DRIFT_WAITING_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DRIFT_DELIVERED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function createDriftLetters({ db, HttpsError, FieldValue, Timestamp, logger, enforceDriftLimit, driftParticipantKey }) {
  async function sendDriftLetter(request) {
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
  }

  async function receiveDriftLetter(request) {
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
  }

  return { sendDriftLetter, receiveDriftLetter };
}

module.exports = { createDriftLetters };
