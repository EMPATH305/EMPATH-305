'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createContentReports } = require('../lib/content-reports');

class HttpsError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const NOW = 1800000000000;
const RETENTION = 180 * 86400000;
const valid = { targetCollection:'warmth', targetId:'target-1', reason:'spam' };

function fixture(t, { limited = false, exists = true, failure } = {}) {
  t.mock.timers.enable({ apis:['Date'], now:NOW });
  const calls = [], writes = [], logs = [];
  const db = {
    collection(name) {
      calls.push(['collection', name]);
      return {
        doc(id) {
          calls.push(['doc', id]);
          return { async get() {
            if (failure === 'read') throw new Error('read failed');
            return { exists };
          } };
        },
        async add(data) {
          if (failure === 'write') throw new Error('write failed');
          writes.push(data);
          return { id:'report-1' };
        }
      };
    }
  };
  const handlers = createContentReports({
    db, HttpsError,
    FieldValue:{ serverTimestamp:() => 'server-time' },
    Timestamp:{ fromMillis:ms => ({ toMillis:() => ms }) },
    logger:{ info:(...args) => logs.push(args) },
    enforceReportLimit:async () => {
      calls.push(['limit']);
      if (limited) throw new HttpsError('resource-exhausted', 'limit');
    },
    CONTENT_REPORT_RETENTION_MS:RETENTION
  });
  return { ...handlers, calls, writes, logs };
}

test('invalid reports cannot consume rate limits or access data', async t => {
  const f = fixture(t);
  for (const data of [undefined, {}, { ...valid, targetCollection:'private' }, { ...valid, reason:'invalid' }]) {
    await assert.rejects(f.submitContentReport({ data }), { code:'invalid-argument' });
  }
  assert.deepEqual(f.calls, []);
});

test('report rate limits reject before reading or writing content', async t => {
  const f = fixture(t, { limited:true });
  await assert.rejects(f.submitContentReport({ data:valid }), { code:'resource-exhausted' });
  assert.deepEqual(f.calls, [['limit']]);
  assert.deepEqual(f.writes, []);
  assert.deepEqual(f.logs, []);
});

test('missing targets never create a report', async t => {
  const f = fixture(t, { exists:false });
  await assert.rejects(f.submitContentReport({ data:valid }), { code:'not-found' });
  assert.deepEqual(f.writes, []);
  assert.deepEqual(f.logs, []);
});

test('reports retain only validated input and server-owned fields', async t => {
  const f = fixture(t);
  const result = await f.submitContentReport({
    data:{ ...valid, targetId:' target-1 ', status:'closed', appVerified:true,
      createdAt:0, expireAt:0, text:'private content', email:'private@example.test' }
  });
  assert.deepEqual(result, { accepted:true });
  assert.equal(f.writes.length, 1);
  const { expireAt, ...fields } = f.writes[0];
  assert.deepEqual(fields, { ...valid, status:'open', appVerified:false, createdAt:'server-time' });
  assert.equal(expireAt.toMillis(), NOW + RETENTION);
  assert.deepEqual(f.logs, [['Anonymous content report created', {
    reportId:'report-1', targetCollection:'warmth', appVerified:false
  }]]);
});

test('verified app context is recorded without changing report acceptance', async t => {
  const f = fixture(t);
  assert.deepEqual(await f.submitContentReport({ data:valid, app:{ appId:'app-1' } }), { accepted:true });
  assert.equal(f.writes[0].appVerified, true);
  assert.equal(f.logs[0][1].appVerified, true);
});

test('database failures propagate without success logs or accepted responses', async t => {
  for (const failure of ['read', 'write']) {
    const f = fixture(t, { failure });
    await assert.rejects(f.submitContentReport({ data:valid }), new RegExp(failure + ' failed'));
    assert.deepEqual(f.writes, []);
    assert.deepEqual(f.logs, []);
    t.mock.timers.reset();
  }
});
