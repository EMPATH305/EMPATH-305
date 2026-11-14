'use strict';

const crypto = require('node:crypto');
const { validateSoulKeyInput } = require('./validation');

function soulStorageId(soulKey) {
  return `sj_${crypto.createHash('sha256').update(`EMPATH-SOUL-ID:${soulKey}`).digest('hex')}`;
}

function createSoulMaintenance({ db, HttpsError, logger, enforceSoulMaintenanceLimit }) {
  async function retireLegacySoulJourney(request) {
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
  }
  async function deleteSoulJourney(request) {
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
  }

  return { retireLegacySoulJourney, deleteSoulJourney };
}

module.exports = { createSoulMaintenance };
