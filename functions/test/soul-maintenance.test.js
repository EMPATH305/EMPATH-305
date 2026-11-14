'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createSoulMaintenance } = require('../lib/soul-maintenance');
const key='EMP-00112233-44556677-8899AABB-CCDDEEFF';
const id='sj_'+crypto.createHash('sha256').update('EMPATH-SOUL-ID:'+key).digest('hex');
class HttpsError extends Error { constructor(code,message){super(message);this.code=code;} }
function fixture({encrypted,legacy,blocked=false,commitFails=false}={}) {
  const records=new Map(), calls=[], logs=[];
  if(encrypted)records.set(id,encrypted); if(legacy)records.set(key,legacy);
  const db={collection:name=>{assert.equal(name,'user_journeys');return {doc:id=>id};},runTransaction:async fn=>{
    calls.push('transaction');const deletes=[];
    await fn({get:async ref=>({exists:records.has(ref),data:()=>records.get(ref)}),delete:ref=>deletes.push(ref)});
    if(commitFails)throw new Error('transaction failed');
    for(const ref of deletes)records.delete(ref);
  }};
  const handlers=createSoulMaintenance({db,HttpsError,logger:{info:(...args)=>logs.push(args)},enforceSoulMaintenanceLimit:async()=>{calls.push('limit');if(blocked)throw new HttpsError('resource-exhausted','limit');}});
  return {handlers,records,calls,logs};
}
const request={data:{soulKey:key},app:{appId:'test'}};

test('Soul maintenance rejects invalid keys before rate limits or data access',async()=>{
  for(const action of ['retireLegacySoulJourney','deleteSoulJourney']) {
    const f=fixture();await assert.rejects(f.handlers[action]({data:{soulKey:'invalid'}}),{code:'invalid-argument'});
    assert.deepEqual(f.calls,[]);assert.deepEqual(f.logs,[]);
  }
});

test('Soul maintenance rate limit blocks both data operations',async()=>{
  for(const action of ['retireLegacySoulJourney','deleteSoulJourney']) {
    const f=fixture({blocked:true,legacy:{private:'kept'}});
    await assert.rejects(f.handlers[action](request),{code:'resource-exhausted'});
    assert.deepEqual(f.calls,['limit']);assert(f.records.has(key));
  }
});

test('legacy retirement requires the existing encrypted format and preserves both records on rejection',async()=>{
  for(const encrypted of [undefined,{schemaVersion:2,ciphertext:'opaque'},{schemaVersion:3}]) {
    const f=fixture({encrypted,legacy:{private:'kept'}});
    await assert.rejects(f.handlers.retireLegacySoulJourney(request),{code:'failed-precondition'});
    assert(f.records.has(key));assert.equal(f.logs.length,0);
  }
});

test('legacy retirement deletes only legacy data and is idempotent with privacy-safe logging',async()=>{
  const encrypted={schemaVersion:3,ciphertext:'opaque'};
  const f=fixture({encrypted,legacy:{private:'secret words'}});
  assert.deepEqual(await f.handlers.retireLegacySoulJourney(request),{completed:true,retired:true});
  assert.deepEqual(f.records.get(id),encrypted);assert(!f.records.has(key));
  assert.deepEqual(await f.handlers.retireLegacySoulJourney(request),{completed:true,retired:false});
  assert(!JSON.stringify(f.logs).includes(key));assert(!JSON.stringify(f.logs).includes('secret words'));
  assert.equal(f.logs[0][1].storageId,id);assert.equal(f.logs[0][1].appVerified,true);
});

test('deletion removes both backup formats and reports whether a record existed',async()=>{
  for(const [encrypted,legacy] of [[undefined,undefined],[{ciphertext:'opaque'},undefined],[undefined,{private:'text'}],[{ciphertext:'opaque'},{private:'text'}]]) {
    const f=fixture({encrypted,legacy});
    assert.deepEqual(await f.handlers.deleteSoulJourney(request),{completed:true,deleted:Boolean(encrypted||legacy)});
    assert.equal(f.records.size,0);assert.deepEqual(f.calls,['limit','transaction']);
    assert(!JSON.stringify(f.logs).includes(key));
  }
});

test('transaction failure never returns success or logs completion',async()=>{
  for(const action of ['retireLegacySoulJourney','deleteSoulJourney']) {
    const f=fixture({encrypted:{schemaVersion:3,ciphertext:'opaque'},legacy:{private:'kept'},commitFails:true});
    await assert.rejects(f.handlers[action](request),/transaction failed/);
    assert.equal(f.records.size,2);assert.deepEqual(f.logs,[]);
  }
});
