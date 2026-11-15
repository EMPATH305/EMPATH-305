'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createAnonymousMetrics } = require('../lib/anonymous-metrics');
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const NOW = 1800000000000, BUCKET = Math.floor(NOW / 300000);
const request = { data:{clientId:'a'.repeat(32)}, app:{appId:'test'} };
const stamp = ms => ({toMillis:() => ms});
function fixture(t, {fail=false}={}) {
  t.mock.timers.enable({apis:['Date'], now:NOW});
  const records = new Map(), writes = [], logs = [], reads = [];
  const db = { collection:name => ({doc:id => name+'/'+id}), async runTransaction(fn) {
    const pending = [];
    await fn({
      async get(ref) { reads.push(ref); return {exists:records.has(ref), data:() => records.get(ref)}; },
      set(ref, data, options) { pending.push([ref,data,options]); }
    });
    if (fail) throw new Error('commit failed');
    for (const [ref,data,options] of pending) records.set(ref, options?.merge ? {...records.get(ref),...data} : data);
    writes.push(...pending);
  }};
  const handlers = createAnonymousMetrics({db,HttpsError,
    FieldValue:{serverTimestamp:() => 'server-time'}, Timestamp:{fromMillis:stamp},
    logger:{info:(...args) => logs.push(args)},
    anonymousParticipantKey:() => 'participant-hash',requestIp:() => '192.0.2.1',
    rateLimitKey:() => 'source-hash', RATE_LIMIT_SALT:{value:() => 'test-salt'}
  });
  return {handlers,records,writes,logs,reads};
}

test('silent companionship rejects invalid participants before storage', async t => {
  const f=fixture(t);
  await assert.rejects(f.handlers.joinSilentCompanionship({data:{clientId:'bad'}}),{code:'invalid-argument'});
  assert.deepEqual(f.reads,[]); assert.deepEqual(f.writes,[]);
});

test('silent join counts once per bucket, renews next bucket, and stores no raw identity', async t => {
  const f=fixture(t);
  assert.deepEqual(await f.handlers.joinSilentCompanionship(request),{accepted:true,count:1,bucket:BUCKET,counted:true});
  assert.deepEqual(await f.handlers.joinSilentCompanionship(request),{accepted:true,count:1,bucket:BUCKET,counted:false});
  assert.equal(f.writes.length,3);
  assert.equal(f.records.get(`rate_limits/silent_receipt_${BUCKET}_participant-hash`).expiresAt.toMillis(),(BUCKET+2)*300000);
  t.mock.timers.setTime(NOW+300000);
  assert.deepEqual(await f.handlers.joinSilentCompanionship(request),{accepted:true,count:1,bucket:BUCKET+1,counted:true});
  const serialized=JSON.stringify([f.writes,f.logs]);
  for (const secret of [request.data.clientId,'192.0.2.1','test-salt']) assert(!serialized.includes(secret));
});

test('silent source cap blocks new joins but permits existing valid receipt', async t => {
  const f=fixture(t);
  f.records.set(`rate_limits/silent_source_${BUCKET}_source-hash`,{count:5});
  await assert.rejects(f.handlers.joinSilentCompanionship(request),{code:'resource-exhausted'});
  assert.deepEqual(f.writes,[]); assert.deepEqual(f.logs,[]);
  f.records.set(`rate_limits/silent_receipt_${BUCKET}_participant-hash`,{expiresAt:stamp(NOW+1)});
  assert.equal((await f.handlers.joinSilentCompanionship(request)).counted,false);
});

test('silent counts remain bounded and expired receipts do not suppress a join', async t => {
  const f=fixture(t);
  for (const [count,expected] of [[-20,1],['bad',1],[100001,100000]]) {
    f.records.clear();
    f.records.set('metadata/silent_presence',{bucket:BUCKET,count});
    f.records.set(`rate_limits/silent_receipt_${BUCKET}_participant-hash`,{expiresAt:stamp(NOW)});
    const result=await f.handlers.joinSilentCompanionship(request);
    assert.equal(result.count,expected); assert.equal(result.counted,true);
  }
});

test('site visit deduplicates daily and preserves other metadata fields', async t => {
  const f=fixture(t), day=Math.floor(NOW/86400000);
  f.records.set('metadata/site_stats',{totalVisitors:41,other:'preserved'});
  assert.deepEqual(await f.handlers.recordSiteVisit(request),{accepted:true,totalVisitors:42,counted:true});
  assert.deepEqual(await f.handlers.recordSiteVisit(request),{accepted:true,totalVisitors:42,counted:false});
  assert.equal(f.writes.length,2);
  assert.equal(f.records.get(`rate_limits/site_visit_${day}_source-hash`).expiresAt.toMillis(),(day+2)*86400000);
  assert.equal(f.records.get('metadata/site_stats').other,'preserved');
  t.mock.timers.setTime(NOW+86400000);
  assert.deepEqual(await f.handlers.recordSiteVisit(request),{accepted:true,totalVisitors:43,counted:true});
  const serialized=JSON.stringify([f.writes,f.logs]);
  for (const secret of [request.data.clientId,'192.0.2.1','test-salt']) assert(!serialized.includes(secret));
});

test('site visits normalize invalid totals and honor expiration boundary', async t => {
  const f=fixture(t), day=Math.floor(NOW/86400000);
  for (const [totalVisitors,expected] of [[-1,1],['bad',1],[10000001,10000000]]) {
    f.records.clear();
    f.records.set('metadata/site_stats',{totalVisitors});
    f.records.set(`rate_limits/site_visit_${day}_source-hash`,{expiresAt:stamp(NOW)});
    assert.deepEqual(await f.handlers.recordSiteVisit(request),{accepted:true,totalVisitors:expected,counted:true});
  }
});

test('failed transactions never commit counters or log success', async t => {
  const f=fixture(t,{fail:true});
  for (const name of ['joinSilentCompanionship','recordSiteVisit']) {
    await assert.rejects(f.handlers[name](request),/commit failed/);
    assert.equal(f.records.size,0); assert.deepEqual(f.writes,[]); assert.deepEqual(f.logs,[]);
  }
});
