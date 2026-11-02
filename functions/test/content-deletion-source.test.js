'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const functionSource = readFileSync(new URL('../index.js', `file://${__dirname}/`), 'utf8');
const rules = readFileSync(new URL('../../firestore.rules', `file://${__dirname}/`), 'utf8');
const indexes = JSON.parse(readFileSync(new URL('../../firestore.indexes.json', `file://${__dirname}/`), 'utf8'));

test('new persistent room content receives a high-entropy private deletion receipt', () => {
  assert(functionSource.includes("crypto.randomBytes(32).toString('base64url')"));
  assert(functionSource.includes("db.collection('content_deletion_receipts')"));
  assert(functionSource.includes('contentDeletionTokenHash(contentRef.parent.id, contentRef.id, deletionToken)'));
  assert(functionSource.includes('{ deletionToken, deletionExpiresAt }'));
});

test('withdrawal binds the receipt to one target and compares its digest safely', () => {
  assert(functionSource.includes('exports.deleteRoomContent = onCall'));
  assert(functionSource.includes("crypto.createHmac('sha256', RATE_LIMIT_SALT.value())"));
  assert(functionSource.includes('crypto.timingSafeEqual'));
  assert(functionSource.includes('transaction.get(receiptRef)'));
  assert(functionSource.includes('transaction.get(contentRef)'));
  assert(functionSource.includes('transaction.delete(contentRef)'));
  assert(functionSource.includes('transaction.delete(receiptRef)'));
  assert(functionSource.includes("kind:'content-deletion'"));
});

test('withdrawal does not rewrite durable lifetime submission totals', () => {
  const deletionFunction = functionSource.split('exports.deleteRoomContent = onCall')[1]
    .split('exports.reactToRoomContent = onCall')[0];
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
