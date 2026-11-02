'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const functionSource = readFileSync(new URL('../index.js', `file://${__dirname}/`), 'utf8');
const indexes = JSON.parse(readFileSync(new URL('../../firestore.indexes.json', `file://${__dirname}/`), 'utf8'));

test('public room submissions receive a server-owned 180-day expiry', () => {
  assert(functionSource.includes('PUBLIC_CONTENT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000'));
  assert(functionSource.includes("data.expireAt = Timestamp.fromMillis(now + PUBLIC_CONTENT_RETENTION_MS)"));
  assert(functionSource.includes("input.room !== 'a'"));
});

test('public room totals survive TTL deletion through aggregate stats', () => {
  assert(functionSource.includes("doc('public_room_stats')"));
  assert(functionSource.includes('FieldValue.increment(1)'));
  assert(functionSource.includes('healedShards:FieldValue.increment(1)'));
});

test('existing public records have an idempotent retention migration', () => {
  assert(functionSource.includes('exports.initializePublicRetention'));
  assert(functionSource.includes("migrationId !== 'public-retention-v1'"));
  assert(functionSource.includes("marker.completed === true"));
  assert(functionSource.includes('createdAt + PUBLIC_CONTENT_RETENTION_MS'));
});

test('every persistent public room collection has managed TTL enabled', () => {
  for (const collectionGroup of ['emotions', 'stars', 'shards', 'warmth']) {
    const override = indexes.fieldOverrides.find(field =>
      field.collectionGroup === collectionGroup && field.fieldPath === 'expireAt'
    );
    assert.equal(override?.ttl, true, `${collectionGroup} must expire on expireAt`);
  }
});

test('moderation records receive deliberate server-owned retention windows', () => {
  assert(functionSource.includes('CONTENT_REPORT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000'));
  assert(functionSource.includes('MODERATION_AUDIT_RETENTION_MS = 365 * 24 * 60 * 60 * 1000'));
  assert(functionSource.includes('now + CONTENT_REPORT_RETENTION_MS'));
  assert(functionSource.includes('Date.now() + MODERATION_AUDIT_RETENTION_MS'));
});

test('existing moderation records have an idempotent retention migration', () => {
  assert(functionSource.includes('exports.initializeModerationRetention'));
  assert(functionSource.includes("migrationId !== 'moderation-retention-v1'"));
  assert(functionSource.includes("marker.completed === true"));
  assert(functionSource.includes('content_reports:CONTENT_REPORT_RETENTION_MS'));
  assert(functionSource.includes('moderation_audit:MODERATION_AUDIT_RETENTION_MS'));
  assert(functionSource.includes('enforceRetentionMigrationLimit(request)'));
  assert(functionSource.includes("kind:'retention-migration'"));
});

test('moderation collections have managed TTL enabled', () => {
  for (const collectionGroup of ['content_reports', 'moderation_audit']) {
    const override = indexes.fieldOverrides.find(field =>
      field.collectionGroup === collectionGroup && field.fieldPath === 'expireAt'
    );
    assert.equal(override?.ttl, true, `${collectionGroup} must expire on expireAt`);
  }
});
