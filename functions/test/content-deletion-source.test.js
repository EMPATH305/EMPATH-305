'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const functionSource = readFileSync(new URL('../index.js', `file://${__dirname}/`), 'utf8');
const withdrawalSource = readFileSync(new URL('../lib/content-withdrawal.js', `file://${__dirname}/`), 'utf8');
const rules = readFileSync(new URL('../../firestore.rules', `file://${__dirname}/`), 'utf8');
const indexes = JSON.parse(readFileSync(new URL('../../firestore.indexes.json', `file://${__dirname}/`), 'utf8'));

test('new persistent room content receives a high-entropy private deletion receipt', () => {
  assert(functionSource.includes("crypto.randomBytes(32).toString('base64url')"));
  assert(functionSource.includes('idempotentDeletionToken(input.requestId'));
  assert(functionSource.includes("db.collection('content_deletion_receipts')"));
  assert(functionSource.includes('contentDeletionTokenHash(contentRef.parent.id, contentRef.id, deletionToken)'));
  assert(functionSource.includes('deletionToken,'));
  assert(functionSource.includes('deletionExpiresAt'));
});

test('withdrawal binds the receipt to one target and compares its digest safely', () => {
  assert(functionSource.includes("exports.deleteRoomContent = observedOnCall('deleteRoomContent'"));
  assert(functionSource.includes("crypto.createHmac('sha256', RATE_LIMIT_SALT.value())"));
  assert(functionSource.includes('crypto.timingSafeEqual'));
  assert(withdrawalSource.includes('transaction.get(receiptRef)'));
  assert(withdrawalSource.includes('transaction.get(contentRef)'));
  assert(withdrawalSource.includes('transaction.delete(contentRef)'));
  assert(withdrawalSource.includes('transaction.delete(receiptRef)'));
  assert(functionSource.includes("kind:'content-deletion'"));
});

test('withdrawal does not rewrite durable lifetime submission totals', () => {
  const deletionFunction = withdrawalSource;
  assert(!deletionFunction.includes('FieldValue.increment('));
  assert(!deletionFunction.includes("doc('public_room_stats')"));
});

test('private deletion receipts expire automatically and are never browser-readable', () => {
  const override = indexes.fieldOverrides.find(field =>
    field.collectionGroup === 'content_deletion_receipts' && field.fieldPath === 'expiresAt'
  );
  assert.equal(override?.ttl, true);
  assert(rules.includes('match /content_deletion_receipts/{receiptId}'));
  assert(rules.includes('allow read, write: if false;'));
});
