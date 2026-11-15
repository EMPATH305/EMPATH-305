'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createDriftLetters } = require('../lib/drift-letters');
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const clientId = 'a'.repeat(32);
const request = { data:{ clientId, text:'a private letter' }, app:{ appId:'test' } };
function fixture({ records = [], blocked = false, stale = false, contention = false, addFails = false } = {}) {
  const calls = [], logs = [], writes = [];
  const stored = new Map(records.map(([id, data]) => [id, {...data}]));
  const snap = id => ({ id, ref:id, exists:stored.has(id), data:() => stored.get(id) });
  const query = {
    where(...args) { calls.push(['where', ...args]); return this; },
    orderBy(...args) { calls.push(['orderBy', ...args]); return this; },
    limit(n) { assert.equal(n, 30); return this; },
    async get() { calls.push(['query']); return { docs:records.map(([id]) => snap(id)) }; },
    async add(data) { if (addFails) throw new Error('write failed'); writes.push(data); return { id:'new-letter' }; }
  };
  const db = {
    collection(name) { assert.equal(name, 'drift_letters'); calls.push(['collection']); return query; },
    async runTransaction(fn) {
      calls.push(['transaction']);
      if (contention) throw new Error('contention');
      return fn({
        async get(id) { if (stale) stored.set(id, {...stored.get(id), status:'delivered'}); return snap(id); },
        update(id, data) { stored.set(id, {...stored.get(id), ...data}); writes.push(data); }
      });
    }
  };
  const handlers = createDriftLetters({ db, HttpsError,
    FieldValue:{ serverTimestamp:() => 'server-time' }, Timestamp:{ fromMillis:ms => ms },
    logger:{ info:(...args) => logs.push(args), warn:(...args) => logs.push(args) },
    async enforceDriftLimit(req, id, action, limit) {
      assert.equal(req, request); assert.equal(id, clientId); calls.push(['limit', action, limit]);
      if (blocked) throw new HttpsError('resource-exhausted', 'limit');
    },
    driftParticipantKey:id => 'opaque-' + id
  });
  return { handlers, stored, calls, logs, writes };
}
const other = { text:'another private letter', status:'waiting', senderHash:'other' };

test('invalid drift inputs and crisis content stop before limits and storage', async () => {
  const f = fixture();
  for (const name of ['sendDriftLetter', 'receiveDriftLetter']) {
    await assert.rejects(f.handlers[name]({data:{clientId:'bad'}}), {code:'invalid-argument'});
  }
  await assert.rejects(f.handlers.sendDriftLetter({data:{clientId,text:'I want to die'}}), {code:'failed-precondition'});
  assert.deepEqual(f.calls, []);
});

test('both drift actions stop at their existing rate limits', async () => {
  for (const [name, action, limit] of [['sendDriftLetter','send',4],['receiveDriftLetter','receive',8]]) {
    const f = fixture({blocked:true});
    await assert.rejects(f.handlers[name](request), {code:'resource-exhausted'});
    assert.deepEqual(f.calls, [['limit', action, limit]]); assert.deepEqual(f.writes, []);
  }
});

test('send stores waiting letter with 30-day TTL and no raw text or client ID in logs', async () => {
  const f = fixture(), before = Date.now();
  assert.deepEqual(await f.handlers.sendDriftLetter(request), {accepted:true});
  const data = f.writes[0];
  assert.equal(data.text, request.data.text); assert.equal(data.status, 'waiting');
  assert.equal(data.senderHash, 'opaque-' + clientId); assert.equal(data.appVerified, true);
  assert.equal(data.createdAt, 'server-time');
  assert(data.expiresAt >= before + 30*86400000 && data.expiresAt <= Date.now() + 30*86400000);
  assert(!JSON.stringify(f.logs).includes(request.data.text)); assert(!JSON.stringify(f.logs).includes(clientId));
});

test('failed send does not report success', async () => {
  const f = fixture({addFails:true});
  await assert.rejects(f.handlers.sendDriftLetter(request), /write failed/); assert.deepEqual(f.logs, []);
});

test('receive excludes own letters and handles empty queue', async () => {
  for (const records of [[], [['self', {...other,senderHash:'opaque-' + clientId}]]]) {
    const f = fixture({records});
    assert.deepEqual(await f.handlers.receiveDriftLetter(request), {available:false});
    assert(!f.calls.some(call => call[0] === 'transaction')); assert.deepEqual(f.writes, []);
  }
});

test('receive commits delivery once with seven-day TTL and returns bounded text', async () => {
  const f = fixture({records:[['letter', {...other,text:'x'.repeat(550)}]]}), before = Date.now();
  assert.deepEqual(await f.handlers.receiveDriftLetter(request), {available:true,id:'letter',text:'x'.repeat(500)});
  const data = f.stored.get('letter');
  assert.equal(data.status, 'delivered'); assert.equal(data.recipientHash, 'opaque-' + clientId);
  assert(data.expiresAt >= before + 7*86400000 && data.expiresAt <= Date.now() + 7*86400000);
  assert.deepEqual(await f.handlers.receiveDriftLetter(request), {available:false});
  assert.equal(f.writes.length, 1);
  assert(!JSON.stringify(f.logs).includes(clientId)); assert(!JSON.stringify(f.logs).includes('x'.repeat(500)));
});

test('transaction recheck skips a letter claimed after the initial query', async () => {
  const f = fixture({records:[['letter',other]],stale:true});
  assert.deepEqual(await f.handlers.receiveDriftLetter(request), {available:false}); assert.deepEqual(f.writes, []);
});

test('contention attempts at most eight candidates and never reports delivery', async () => {
  const f = fixture({records:Array.from({length:12}, (_,i) => ['letter-'+i, other]),contention:true});
  assert.deepEqual(await f.handlers.receiveDriftLetter(request), {available:false});
  assert.equal(f.calls.filter(call => call[0] === 'transaction').length, 8);
  assert.deepEqual(f.writes, []); assert.equal(f.logs.length, 8);
});
