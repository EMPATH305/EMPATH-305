'use strict';

const { validateContentDeletionInput } = require('./validation');

function createContentWithdrawal({ db, HttpsError, logger, enforceContentDeletionLimit, contentDeletionReceiptId, contentDeletionTokenHash, tokenHashesMatch }) {
  async function deleteRoomContent(request) {
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
  }

  return { deleteRoomContent };
}

module.exports = { createContentWithdrawal };
