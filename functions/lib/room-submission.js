'use strict';

const crypto = require('node:crypto');
const { validateRoomSubmissionInput } = require('./validation');

const SUBMISSION_RECEIPT_TTL_MS = 48 * 60 * 60 * 1000;

function createRoomSubmission({ db, HttpsError, FieldValue, Timestamp, logger, enforceContentSubmissionLimit, RATE_LIMIT_SALT, PUBLIC_CONTENT_RETENTION_MS, contentDeletionReceiptId, contentDeletionTokenHash, tokenHashesMatch }) {
  function submissionReceiptId(requestId) {
    return crypto.createHmac('sha256', RATE_LIMIT_SALT.value())
      .update(`room-submission-receipt:${requestId}`)
      .digest('hex');
  }

  function submissionPayloadHash(input) {
    const canonicalPayload = JSON.stringify({
      room:input.room,
      text:input.text || '',
      image:input.image || '',
      lifespan:input.lifespan || 0,
      weightKind:input.weightKind || ''
    });
    return crypto.createHmac('sha256', RATE_LIMIT_SALT.value())
      .update(`room-submission-payload:${canonicalPayload}`)
      .digest('hex');
  }

  function idempotentDeletionToken(requestId, targetCollection, targetId) {
    return crypto.createHmac('sha256', RATE_LIMIT_SALT.value())
      .update(`room-submission-deletion-token:${requestId}:${targetCollection}:${targetId}`)
      .digest('base64url');
  }

  function submissionResponseFromReceipt(input, receipt, expectedCollection) {
    if (receipt.room !== input.room
        || receipt.targetCollection !== expectedCollection
        || !/^[A-Za-z0-9_-]{1,160}$/.test(String(receipt.contentId || ''))) {
      throw new HttpsError('internal', 'The submission receipt is unavailable.');
    }
    const response = { accepted:true, id:receipt.contentId, deduplicated:true };
    if (input.room === 'a') {
      const totalReleased = Math.max(0, Number(receipt.roomStats?.totalReleased) || 0);
      const sameKind = Math.max(0, Number(receipt.roomStats?.sameKind) || 0);
      if (!totalReleased || !sameKind) {
        throw new HttpsError('internal', 'The submission receipt is unavailable.');
      }
      response.roomStats = { totalReleased, sameKind };
    } else {
      const deletionExpiresAt = receipt.deletionExpiresAt?.toMillis?.()
        || Number(receipt.deletionExpiresAt) || 0;
      if (deletionExpiresAt <= Date.now()) {
        throw new HttpsError('not-found', 'The submission receipt is no longer available.');
      }
      response.deletionToken = idempotentDeletionToken(
        input.requestId, expectedCollection, receipt.contentId
      );
      response.deletionExpiresAt = deletionExpiresAt;
    }
    return response;
  }

  function reuseSubmissionReceipt(input, receiptSnapshot, payloadHash, expectedCollection, now) {
    if (!receiptSnapshot?.exists) return null;
    const receipt = receiptSnapshot.data() || {};
    const expiresAt = receipt.expiresAt?.toMillis?.() || Number(receipt.expiresAt) || 0;
    if (expiresAt <= now) return null;
    if (!tokenHashesMatch(receipt.payloadHash, payloadHash)) {
      throw new HttpsError('already-exists', 'This request ID was already used for different content.');
    }
    return submissionResponseFromReceipt(input, receipt, expectedCollection);
  }


  async function submitRoomContent(request) {
    const input = validateRoomSubmissionInput(request.data);
    if (!input) throw new HttpsError('invalid-argument', 'Invalid room submission.');
    await enforceContentSubmissionLimit(request);

    const collectionByRoom = {
      e:'emotions', m:'stars', p:'shards', a:'sand', t:'warmth'
    };
    const now = Date.now();
    const data = {
      createdAt:FieldValue.serverTimestamp(),
      appVerified:Boolean(request.app)
    };
    if (input.room !== 'a') {
      data.expireAt = Timestamp.fromMillis(now + PUBLIC_CONTENT_RETENTION_MS);
    }
    if (input.room === 'e') {
      if (input.text) data.text = input.text;
      if (input.image) data.image = input.image;
    } else if (input.room === 'm') {
      Object.assign(data, {
        text:input.text,
        brightness:1,
        clicks:0,
        colorIdx:crypto.randomInt(0, 6),
        relX:0.05 + (crypto.randomInt(0, 900_001) / 1_000_000),
        relY:0.05 + (crypto.randomInt(0, 900_001) / 1_000_000)
      });
    } else if (input.room === 'p') {
      Object.assign(data, { text:input.text, healed:false });
    } else if (input.room === 'a') {
      Object.assign(data, {
        text:input.text,
        absoluteTime:now,
        lifespan:input.lifespan,
        expireAt:Timestamp.fromMillis(now + input.lifespan)
      });
    } else {
      Object.assign(data, { text:input.text, echos:0 });
    }

    const contentRef = db.collection(collectionByRoom[input.room]).doc();
    const submissionReceiptRef = input.requestId
      ? db.collection('submission_receipts').doc(submissionReceiptId(input.requestId))
      : null;
    const payloadHash = input.requestId ? submissionPayloadHash(input) : null;
    const submissionReceiptExpiresAt = now + SUBMISSION_RECEIPT_TTL_MS;
    let submissionResult = null;
    if (input.room === 'a') {
      const statsRef = db.collection('metadata').doc('room_a_stats');
      await db.runTransaction(async transaction => {
        const snapshots = await Promise.all([
          transaction.get(statsRef),
          ...(submissionReceiptRef ? [transaction.get(submissionReceiptRef)] : [])
        ]);
        const [statsSnapshot, receiptSnapshot] = snapshots;
        const reused = reuseSubmissionReceipt(
          input, receiptSnapshot, payloadHash, contentRef.parent.id, now
        );
        if (reused) {
          submissionResult = reused;
          return;
        }
        const existingStats = statsSnapshot.exists ? statsSnapshot.data() : {};
        const totalReleased = Math.max(0, Number(existingStats?.totalReleased) || 0) + 1;
        const kindCounts = Object.fromEntries(
          ['relationship', 'loss', 'self', 'future', 'unnamed'].map(kind => [
            kind,
            Math.max(0, Number(existingStats?.kindCounts?.[kind]) || 0)
          ])
        );
        kindCounts[input.weightKind] += 1;
        transaction.set(contentRef, data);
        transaction.set(statsRef, { totalReleased, kindCounts }, { merge:true });
        const roomStats = {
          totalReleased,
          sameKind:kindCounts[input.weightKind],
          weightKind:input.weightKind
        };
        if (submissionReceiptRef) {
          transaction.set(submissionReceiptRef, {
            room:input.room,
            contentId:contentRef.id,
            targetCollection:contentRef.parent.id,
            payloadHash,
            roomStats:{ totalReleased, sameKind:kindCounts[input.weightKind] },
            createdAt:FieldValue.serverTimestamp(),
            expiresAt:Timestamp.fromMillis(submissionReceiptExpiresAt)
          });
        }
        submissionResult = { accepted:true, id:contentRef.id, roomStats };
      });
    } else {
      const publicStatsRef = db.collection('metadata').doc('public_room_stats');
      const statsFieldByRoom = { e:'emotions', m:'stars', p:'shards', t:'warmth' };
      const deletionToken = input.requestId
        ? idempotentDeletionToken(input.requestId, contentRef.parent.id, contentRef.id)
        : crypto.randomBytes(32).toString('base64url');
      const deletionExpiresAt = now + PUBLIC_CONTENT_RETENTION_MS;
      const receiptRef = db.collection('content_deletion_receipts').doc(
        contentDeletionReceiptId(contentRef.parent.id, contentRef.id)
      );
      await db.runTransaction(async transaction => {
        const submissionReceiptSnapshot = submissionReceiptRef
          ? await transaction.get(submissionReceiptRef)
          : null;
        const reused = reuseSubmissionReceipt(
          input, submissionReceiptSnapshot, payloadHash, contentRef.parent.id, now
        );
        if (reused) {
          submissionResult = reused;
          return;
        }
        transaction.set(contentRef, data);
        transaction.set(receiptRef, {
          targetCollection:contentRef.parent.id,
          targetId:contentRef.id,
          tokenHash:contentDeletionTokenHash(contentRef.parent.id, contentRef.id, deletionToken),
          createdAt:FieldValue.serverTimestamp(),
          expiresAt:Timestamp.fromMillis(deletionExpiresAt)
        });
        transaction.set(publicStatsRef, {
          [statsFieldByRoom[input.room]]:FieldValue.increment(1),
          updatedAt:FieldValue.serverTimestamp()
        }, { merge:true });
        if (submissionReceiptRef) {
          transaction.set(submissionReceiptRef, {
            room:input.room,
            contentId:contentRef.id,
            targetCollection:contentRef.parent.id,
            payloadHash,
            deletionExpiresAt:Timestamp.fromMillis(deletionExpiresAt),
            createdAt:FieldValue.serverTimestamp(),
            expiresAt:Timestamp.fromMillis(submissionReceiptExpiresAt)
          });
        }
        submissionResult = {
          accepted:true,
          id:contentRef.id,
          deletionToken,
          deletionExpiresAt
        };
      });
    }
    logger.info('Anonymous room content created', {
      room:input.room,
      contentId:submissionResult.id,
      deduplicated:Boolean(submissionResult.deduplicated),
      appVerified:Boolean(request.app)
    });
    return submissionResult;
  }

  return { submitRoomContent };
}

module.exports = { createRoomSubmission };
