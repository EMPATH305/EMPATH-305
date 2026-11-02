'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const functionSource = readFileSync(new URL('../index.js', `file://${__dirname}/`), 'utf8');
const rules = readFileSync(new URL('../../firestore.rules', `file://${__dirname}/`), 'utf8');
const indexes = JSON.parse(readFileSync(new URL('../../firestore.indexes.json', `file://${__dirname}/`), 'utf8'));

test('submission request IDs use private HMAC document keys and canonical payload digests', () => {
  assert(functionSource.includes(".update(`room-submission-receipt:${requestId}`)"));
  assert(functionSource.includes(".update(`room-submission-payload:${canonicalPayload}`)"));
  assert(functionSource.includes("db.collection('submission_receipts').doc(submissionReceiptId(input.requestId))"));
  assert(functionSource.includes('crypto.timingSafeEqual'));
  assert(functionSource.includes("new HttpsError('already-exists'"));
});

test('the content write and idempotency receipt share one transaction', () => {
  const submissionFunction = functionSource.split('exports.submitRoomContent = onCall')[1]
    .split('exports.deleteRoomContent = onCall')[0];
  assert(submissionFunction.includes('transaction.get(submissionReceiptRef)'));
  assert(submissionFunction.includes('transaction.set(submissionReceiptRef'));
  assert(submissionFunction.includes('transaction.set(contentRef, data)'));
  assert(submissionFunction.includes('deduplicated:Boolean(submissionResult.deduplicated)'));
});

test('retryable deletion credentials are derived and never stored raw', () => {
  assert(functionSource.includes(".update(`room-submission-deletion-token:${requestId}:${targetCollection}:${targetId}`)"));
  const receiptWrite = functionSource.split('transaction.set(submissionReceiptRef')[1]
    .split('});')[0];
  assert(!receiptWrite.includes('deletionToken'));
  assert(functionSource.includes('tokenHash:contentDeletionTokenHash'));
});

test('private submission receipts expire after 48 hours and are never browser-readable', () => {
  assert(functionSource.includes('const SUBMISSION_RECEIPT_TTL_MS = 48 * 60 * 60 * 1000;'));
  const override = indexes.fieldOverrides.find(field =>
    field.collectionGroup === 'submission_receipts' && field.fieldPath === 'expiresAt'
  );
  assert.equal(override?.ttl, true);
  assert(rules.includes('match /submission_receipts/{receiptId}'));
  assert(rules.includes('allow read, write: if false;'));
});
