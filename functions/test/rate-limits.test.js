'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRateLimits } = require('../lib/rate-limits');
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const NOW = 1800000000000;
const request = { rawRequest:{ ip:'192.0.2.1' } };
const hourly = [
  ['enforceSoulMaintenanceLimit', 8, 'soul_maintenance'],
  ['enforceRetentionMigrationLimit', 4, 'retention_migration'],
  ['enforceReportLimit', 8, 'report'],
  ['enforceContentDeletionLimit', 10, 'content_deletion'],
  ['enforceReactionLimit', 40, 'reaction_hour']
];
function fixture(t) {
  t.mock.timers.enable({ apis:['Date'], now:NOW });
  const records = new Map();
  let fail = false;
  const handlers = createRateLimits({
    HttpsError, RATE_LIMIT_SALT:{ value:() => 'test-salt' },
    FieldValue:{ serverTimestamp:() => 'server-time' }, Timestamp:{ fromMillis:ms => ms },
    REPORT_LIMIT_PER_HOUR:8, CONTENT_LIMIT_PER_HOUR:12, CONTENT_LIMIT_PER_TEN_MINUTES:6,
    CONTENT_DELETION_LIMIT_PER_HOUR:10, REACTION_LIMIT_PER_HOUR:40,
    SOUL_MAINTENANCE_LIMIT_PER_HOUR:8, RETENTION_MIGRATION_LIMIT_PER_HOUR:4,
    db:{
      collection(name) { assert.equal(name, 'rate_limits'); return { doc:id => ({ id }) }; },
      async runTransaction(fn) {
        const pending = [];
        await fn({
          get:async ref => ({ exists:records.has(ref.id), data:() => records.get(ref.id) }),
          set:(ref, data, options) => { assert.equal(options.merge, true); pending.push([ref.id, data]); }
        });
        if (fail) throw new Error('commit failed');
        for (const [id, data] of pending) records.set(id, { ...records.get(id), ...data });
      }
    }
  });
  return { handlers, records, fail:() => { fail = true; } };
}
for (const [name, limit, prefix] of hourly) {
  test(name + ' preserves hourly ceiling, expiry and hashed identity', async t => {
    const f = fixture(t);
    for (let i = 0; i < limit; i++) await f.handlers[name](request);
    await assert.rejects(f.handlers[name](request), { code:'resource-exhausted' });
    const key = crypto.createHmac('sha256', 'test-salt').update('192.0.2.1').digest('hex').slice(0, 40);
    const id = `${prefix}_${Math.floor(NOW / 3600000)}_${key}`;
    assert.equal(f.records.size, 1);
    assert.equal(f.records.get(id).count, limit);
    assert.equal(f.records.get(id).expiresAt, (Math.floor(NOW / 3600000) + 2) * 3600000);
    assert(!JSON.stringify([...f.records]).includes('192.0.2.1'));
    t.mock.timers.setTime(NOW + 3600000);
    await f.handlers[name](request);
    assert.equal(f.records.size, 2);
  });
}
test('submissions enforce both burst and hourly budgets without partial increments', async t => {
  const f = fixture(t);
  for (let i = 0; i < 6; i++) await f.handlers.enforceContentSubmissionLimit(request);
  const before = [...f.records].map(([id, data]) => [id, { ...data }]);
  await assert.rejects(f.handlers.enforceContentSubmissionLimit(request), { code:'resource-exhausted' });
  assert.deepEqual([...f.records], before);
  t.mock.timers.setTime(NOW + 600000);
  for (let i = 0; i < 6; i++) await f.handlers.enforceContentSubmissionLimit(request);
  t.mock.timers.setTime(NOW + 1200000);
  await assert.rejects(f.handlers.enforceContentSubmissionLimit(request), { code:'resource-exhausted' });
  assert.equal([...f.records.values()].find(x => x.window === 'hour').count, 12);
  assert.equal(f.records.size, 3);
});
test('drift limits isolate actions and client identifiers', async t => {
  const f = fixture(t);
  await f.handlers.enforceDriftLimit(request, 'client-a', 'send', 1);
  await assert.rejects(f.handlers.enforceDriftLimit(request, 'client-a', 'send', 1), { code:'resource-exhausted' });
  await f.handlers.enforceDriftLimit(request, 'client-a', 'receive', 1);
  await f.handlers.enforceDriftLimit(request, 'client-b', 'send', 1);
  assert.equal(f.records.size, 3);
  assert(!JSON.stringify([...f.records]).includes('client-a'));
});
test('IP selection retains direct, socket, forwarded and unknown fallbacks', async t => {
  const f = fixture(t);
  const inputs = [
    [request, '192.0.2.1'],
    [{ rawRequest:{ socket:{ remoteAddress:'192.0.2.2' } } }, '192.0.2.2'],
    [{ rawRequest:{ headers:{ 'x-forwarded-for':'192.0.2.3, 192.0.2.4' } } }, '192.0.2.3'],
    [{ rawRequest:{ headers:{ 'x-forwarded-for':['192.0.2.5'] } } }, '192.0.2.5'],
    [{}, 'unknown']
  ];
  for (const [input, ip] of inputs) {
    await f.handlers.enforceReportLimit(input);
    const hash = crypto.createHmac('sha256', 'test-salt').update(ip).digest('hex').slice(0, 40);
    assert([...f.records.keys()].some(key => key.endsWith(hash)));
  }
});
test('failed rate-limit transaction commits no quota updates', async t => {
  const f = fixture(t); f.fail();
  await assert.rejects(f.handlers.enforceContentSubmissionLimit(request), /commit failed/);
  assert.equal(f.records.size, 0);
});
