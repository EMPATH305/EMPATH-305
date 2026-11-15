'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {createRoomSubmission}=require('../lib/room-submission');
class HttpsError extends Error { constructor(code,message){super(message);this.code=code;} }
const NOW=1800000000000,RETENTION=180*86400000;
const requestId='a'.repeat(32);
const req=(room='e',extra={})=>({data:{room,text:'private words',requestId,...extra},app:{appId:'test'}});
function fixture(t,{blocked=false,fail=false}={}) {
  t.mock.timers.enable({apis:['Date'],now:NOW});
  const records=new Map(),writes=[],logs=[],calls=[];let seq=0;
  const db={collection:name=>({doc:(id='new-'+(++seq))=>({id,parent:{id:name},path:name+'/'+id})}),async runTransaction(fn){
    calls.push('transaction');const pending=[];
    await fn({get:async ref=>({exists:records.has(ref.path),data:()=>records.get(ref.path)}),set:(ref,data,options)=>pending.push([ref.path,data,options?.merge])});
    if(fail)throw new Error('commit failed');
    for(const [path,data,merge] of pending){
      const result=merge?{...records.get(path)}:{};
      for(const [key,value] of Object.entries(data))result[key]=value?.increment!==undefined?(Number(result[key])||0)+value.increment:value;
      records.set(path,result);
    }
    writes.push(...pending);
  }};
  const handlers=createRoomSubmission({db,HttpsError,FieldValue:{serverTimestamp:()=> 'server-time',increment:n=>({increment:n})},Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},logger:{info:(...args)=>logs.push(args)},
    enforceContentSubmissionLimit:async()=>{calls.push('limit');if(blocked)throw new HttpsError('resource-exhausted','limit');},
    RATE_LIMIT_SALT:{value:()=> 'test-salt'},PUBLIC_CONTENT_RETENTION_MS:RETENTION,
    contentDeletionReceiptId:(collection,id)=>collection+'-'+id,
    contentDeletionTokenHash:(collection,id,token)=>crypto.createHash('sha256').update(collection+id+token).digest('hex'),
    tokenHashesMatch:(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b))});
  return {handlers,records,writes,logs,calls};
}

test('invalid submissions and rate limits stop before transactions',async t=>{
  const f=fixture(t,{blocked:true});
  await assert.rejects(f.handlers.submitRoomContent(req('invalid')),{code:'invalid-argument'});
  assert.deepEqual(f.calls,[]);
  await assert.rejects(f.handlers.submitRoomContent(req()),{code:'resource-exhausted'});
  assert.deepEqual(f.calls,['limit']);assert.equal(f.records.size,0);
});

test('persistent rooms retain fields, expiry, private credentials and one aggregate increment',async t=>{
  const f=fixture(t);
  for(const [room,collection] of [['e','emotions'],['m','stars'],['p','shards'],['t','warmth']]){
    f.records.clear();f.writes.length=0;
    const result=await f.handlers.submitRoomContent(req(room));const content=f.records.get(collection+'/'+result.id);
    assert.equal(content.text,'private words');assert.equal(content.expireAt.toMillis(),NOW+RETENTION);
    assert.equal(f.records.get('metadata/public_room_stats')[collection],1);
    assert.match(result.deletionToken,/^[A-Za-z0-9_-]{43}$/);assert.equal(result.deletionExpiresAt,NOW+RETENTION);
    if(room==='m'){assert.equal(content.brightness,1);assert.equal(content.clicks,0);assert(content.relX>=0.05&&content.relX<=0.950001);assert(content.colorIdx>=0&&content.colorIdx<6);}
    if(room==='p')assert.equal(content.healed,false);
    if(room==='t')assert.equal(content.echos,0);
    assert(!JSON.stringify([...f.records.values()]).includes(result.deletionToken));
    const count=f.writes.length;const retry=await f.handlers.submitRoomContent(req(room));
    assert.deepEqual(retry,{...result,deduplicated:true});assert.equal(f.writes.length,count);
  }
  assert(!JSON.stringify(f.logs).includes('private words'));assert(!JSON.stringify(f.logs).includes(requestId));
});

test('room A counts category separately from private text and deduplicates retries',async t=>{
  const f=fixture(t),request=req('a',{lifespan:60000,weightKind:'loss'});
  const result=await f.handlers.submitRoomContent(request);
  assert.deepEqual(result.roomStats,{totalReleased:1,sameKind:1,weightKind:'loss'});
  const content=f.records.get('sand/'+result.id);assert.equal(content.expireAt.toMillis(),NOW+60000);assert(!('weightKind' in content));
  assert(![...f.records.keys()].some(key=>key.startsWith('content_deletion_receipts/')));
  const count=f.writes.length;
  assert.deepEqual(await f.handlers.submitRoomContent(request),{accepted:true,id:result.id,deduplicated:true,roomStats:{totalReleased:1,sameKind:1}});
  assert.equal(f.writes.length,count);
});

test('request ID reuse with changed payload is rejected for both submission branches',async t=>{
  const f=fixture(t);
  for(const room of ['e','a']){
    f.records.clear();const request=req(room,{lifespan:60000});
    await f.handlers.submitRoomContent(request);const count=f.writes.length;
    await assert.rejects(f.handlers.submitRoomContent({...request,data:{...request.data,text:'changed'}}),{code:'already-exists'});
    assert.equal(f.writes.length,count);
  }
});

test('expired submission receipt permits a new submission at the 48-hour boundary',async t=>{
  const f=fixture(t);const first=await f.handlers.submitRoomContent(req());
  const receipt=[...f.records.entries()].find(([key])=>key.startsWith('submission_receipts/'));
  assert(!receipt[0].includes(requestId));assert.equal(receipt[1].expiresAt.toMillis(),NOW+48*3600000);
  t.mock.timers.setTime(NOW+48*3600000);
  const next=await f.handlers.submitRoomContent(req());assert.notEqual(next.id,first.id);
  assert.equal(f.records.get('metadata/public_room_stats').emotions,2);
});

test('image submissions retain image-only content and legacy requests have random deletion tokens',async t=>{
  const f=fixture(t);const image='data:image/png;base64,YQ==';
  const result=await f.handlers.submitRoomContent({data:{room:'e',image}});
  const content=f.records.get('emotions/'+result.id);assert.equal(content.image,image);assert(!('text' in content));
  assert.match(result.deletionToken,/^[A-Za-z0-9_-]{43}$/);
  assert(![...f.records.keys()].some(key=>key.startsWith('submission_receipts/')));
});

test('corrupt or unusable retry receipts fail without new writes',async t=>{
  const f=fixture(t);await f.handlers.submitRoomContent(req());
  const receipt=[...f.records.values()].find(value=>value.payloadHash);
  const count=f.writes.length;receipt.targetCollection='stars';
  await assert.rejects(f.handlers.submitRoomContent(req()),{code:'internal'});
  receipt.targetCollection='emotions';receipt.deletionExpiresAt={toMillis:()=>NOW};
  await assert.rejects(f.handlers.submitRoomContent(req()),{code:'not-found'});
  assert.equal(f.writes.length,count);
});

test('failed submission transaction leaves no content, counters or credentials in either branch',async t=>{
  const f=fixture(t,{fail:true});
  for(const room of ['e','a']){
    await assert.rejects(f.handlers.submitRoomContent(req(room,{lifespan:60000})),/commit failed/);
    assert.equal(f.records.size,0);assert.deepEqual(f.writes,[]);assert.deepEqual(f.logs,[]);
  }
});
