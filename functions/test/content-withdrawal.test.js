'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createContentWithdrawal } = require('../lib/content-withdrawal');
class HttpsError extends Error { constructor(code,message) { super(message); this.code=code; } }
const NOW=1800000000000;
const request={data:{targetCollection:'emotions',targetId:'post-123',deletionToken:'a'.repeat(43)},app:{appId:'test'}};
const receiptRef='content_deletion_receipts/opaque-receipt';
const contentRef='emotions/post-123';
function fixture(t,{blocked=false,fail=false,receipt=true,content=true}={}) {
  t.mock.timers.enable({apis:['Date'],now:NOW});
  const records=new Map(),calls=[],logs=[];
  if(receipt) records.set(receiptRef,{targetCollection:'emotions',targetId:'post-123',expiresAt:{toMillis:()=>NOW+1},tokenHash:'expected-hash'});
  if(content) records.set(contentRef,{text:'private content'});
  const db={collection:name=>({doc:id=>name+'/'+id}),async runTransaction(fn){
    calls.push('transaction');const deletes=[];
    await fn({get:async ref=>({exists:records.has(ref),data:()=>records.get(ref)}),delete:ref=>deletes.push(ref)});
    if(fail)throw new Error('commit failed');
    for(const ref of deletes)records.delete(ref);
  }};
  const handlers=createContentWithdrawal({db,HttpsError,logger:{info:(...args)=>logs.push(args)},
    async enforceContentDeletionLimit(){calls.push('limit');if(blocked)throw new HttpsError('resource-exhausted','limit');},
    contentDeletionReceiptId:(collection,id)=>{assert.equal(collection,'emotions');assert.equal(id,'post-123');return 'opaque-receipt';},
    contentDeletionTokenHash:(collection,id,token)=>{assert.equal(collection,'emotions');assert.equal(id,'post-123');return token===request.data.deletionToken?'expected-hash':'wrong-hash';},
    tokenHashesMatch:(expected,actual)=>expected==='expected-hash'&&actual===expected
  });
  return {handlers,records,calls,logs};
}

test('withdrawal validates collection, ID and token before data access',async t=>{
  const f=fixture(t);
  for(const data of [{...request.data,targetCollection:'user_journeys'},{...request.data,targetId:'bad/id'},{...request.data,deletionToken:'short'}]) {
    await assert.rejects(f.handlers.deleteRoomContent({data}),{code:'invalid-argument'});
  }
  assert.deepEqual(f.calls,[]);assert.equal(f.records.size,2);
});

test('withdrawal rate limit prevents any deletion',async t=>{
  const f=fixture(t,{blocked:true});
  await assert.rejects(f.handlers.deleteRoomContent(request),{code:'resource-exhausted'});
  assert.deepEqual(f.calls,['limit']);assert.equal(f.records.size,2);
});

test('missing, expired or mismatched receipts preserve content',async t=>{
  const f=fixture(t);
  const original=f.records.get(receiptRef);
  for(const receipt of [null,{...original,expiresAt:{toMillis:()=>NOW}},{...original,expiresAt:undefined},{...original,targetCollection:'stars'},{...original,targetId:'another'}]) {
    if(receipt)f.records.set(receiptRef,receipt);else f.records.delete(receiptRef);
    await assert.rejects(f.handlers.deleteRoomContent(request),{code:'not-found'});
    assert(f.records.has(contentRef));assert.deepEqual(f.logs,[]);
    if(receipt)assert(f.records.has(receiptRef));
  }
});

test('incorrect tokens and malformed stored hashes cannot delete content or receipts',async t=>{
  const f=fixture(t);
  await assert.rejects(f.handlers.deleteRoomContent({data:{...request.data,deletionToken:'b'.repeat(43)}}),{code:'permission-denied'});
  f.records.get(receiptRef).tokenHash='malformed';
  await assert.rejects(f.handlers.deleteRoomContent(request),{code:'permission-denied'});
  assert.equal(f.records.size,2);assert.deepEqual(f.logs,[]);
});

test('valid withdrawal deletes both records and a repeated request remains not-found',async t=>{
  const f=fixture(t);
  assert.deepEqual(await f.handlers.deleteRoomContent(request),{completed:true,deleted:true});
  assert.equal(f.records.size,0);
  await assert.rejects(f.handlers.deleteRoomContent(request),{code:'not-found'});
  assert.equal(f.logs.length,1);
  const serialized=JSON.stringify(f.logs);
  assert(!serialized.includes(request.data.deletionToken));assert(!serialized.includes('private content'));
});

test('valid receipt is consumed even when the content is already absent',async t=>{
  const f=fixture(t,{content:false});
  assert.deepEqual(await f.handlers.deleteRoomContent(request),{completed:true,deleted:false});
  assert.equal(f.records.size,0);
});

test('commit failure preserves both records and never logs success',async t=>{
  const f=fixture(t,{fail:true});
  await assert.rejects(f.handlers.deleteRoomContent(request),/commit failed/);
  assert.equal(f.records.size,2);assert.deepEqual(f.logs,[]);
});
