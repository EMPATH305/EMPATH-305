'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createRoomReactions}=require('../lib/room-reactions');
class HttpsError extends Error { constructor(code,message){super(message);this.code=code;} }
const NOW=1800000000000;
function fixture(t,{blocked=false,fail=false}={}) {
  t.mock.timers.enable({apis:['Date'],now:NOW});
  const records=new Map(),writes=[],logs=[],calls=[];let sequence=0;
  const db={collection:name=>({doc:(id='auto-'+(++sequence))=>({id,path:name+'/'+id})}),async runTransaction(fn){
    calls.push('transaction');const pending=[];
    await fn({get:async ref=>({exists:records.has(ref.path),data:()=>records.get(ref.path)}),
      set:(ref,data,options)=>pending.push([ref.path,data,options?.merge]),
      update:(ref,data)=>pending.push([ref.path,data,true])});
    if(fail)throw new Error('commit failed');
    for(const [path,data,merge] of pending){
      const result=merge?{...records.get(path)}:{};
      for(const [key,value] of Object.entries(data))result[key]=value?.increment!==undefined?(Number(result[key])||0)+value.increment:value;
      records.set(path,result);
    }
    writes.push(...pending);
  }};
  const handlers=createRoomReactions({db,HttpsError,FieldValue:{serverTimestamp:()=> 'server-time',increment:n=>({increment:n})},Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},logger:{info:(...args)=>logs.push(args)},
    enforceReactionLimit:async()=>{calls.push('limit');if(blocked)throw new HttpsError('resource-exhausted','limit');},
    rateLimitKey:()=> 'opaque-source',RATE_LIMIT_SALT:{value:()=> 'secret-salt'}});
  return {handlers,records,writes,logs,calls};
}
const req=(kind='star',extra={})=>({data:{kind,targetId:'target',...extra},app:{appId:'test'}});

test('reactions reject invalid types and unsafe neighbors before storage',async t=>{
  const f=fixture(t);
  for(const request of [req('unknown'),req('star',{neighborIds:['target']}),req('star',{neighborIds:['same','same']}),req('warmth',{neighborIds:[]})]) {
    await assert.rejects(f.handlers.reactToRoomContent(request),{code:'invalid-argument'});
  }
  assert.deepEqual(f.calls,[]);
});

test('reaction rate limit blocks writes',async t=>{
  const f=fixture(t,{blocked:true});
  await assert.rejects(f.handlers.reactToRoomContent(req()),{code:'resource-exhausted'});
  assert.deepEqual(f.calls,['limit']);assert.deepEqual(f.writes,[]);
});

test('missing reaction target produces no receipt',async t=>{
  const f=fixture(t);
  await assert.rejects(f.handlers.reactToRoomContent(req()),{code:'not-found'});
  assert.deepEqual(f.writes,[]);assert.deepEqual(f.logs,[]);
});

test('star reaction connects only existing neighbors and retains TTLs',async t=>{
  const f=fixture(t);f.records.set('stars/target',{clicks:2,brightness:3});f.records.set('stars/neighbor',{});
  assert.deepEqual(await f.handlers.reactToRoomContent(req('star',{neighborIds:['neighbor','missing']})),{accepted:true,clicks:3,brightness:4,connectedIds:['neighbor']});
  const connections=[...f.records.entries()].filter(([path])=>path.startsWith('constellations/'));
  assert.equal(connections.length,1);assert.equal(connections[0][1].expiresAt.toMillis(),NOW+86400000);
  const receipts=[...f.records.entries()].filter(([path])=>path.startsWith('rate_limits/'));
  assert.equal(receipts.length,1);assert.equal(receipts[0][1].expiresAt.toMillis(),NOW+48*3600000);
  assert(!receipts[0][0].includes('target'));assert(!JSON.stringify([f.writes,f.logs]).includes('secret-salt'));
});

test('duplicate reactions are blocked until the receipt expiration boundary',async t=>{
  const f=fixture(t);f.records.set('warmth/target',{echos:0});
  assert.deepEqual(await f.handlers.reactToRoomContent(req('warmth')),{accepted:true,echos:1});
  const count=f.writes.length;
  await assert.rejects(f.handlers.reactToRoomContent(req('warmth')),{code:'already-exists'});
  assert.equal(f.writes.length,count);
  t.mock.timers.setTime(NOW+48*3600000);
  assert.deepEqual(await f.handlers.reactToRoomContent(req('warmth')),{accepted:true,echos:2});
});

test('star and warmth counters normalize invalid values and retain caps',async t=>{
  const f=fixture(t);
  for(const [value,clicks,brightness] of [[-1,1,2],['bad',1,2],[2000000,1000000,12]]) {
    f.records.clear();f.records.set('stars/target',{clicks:value,brightness:value});
    assert.deepEqual(await f.handlers.reactToRoomContent(req()),{accepted:true,clicks,brightness,connectedIds:[]});
    f.records.clear();f.records.set('warmth/target',{echos:value});
    assert.deepEqual(await f.handlers.reactToRoomContent(req('warmth')),{accepted:true,echos:clicks});
  }
});

test('only an unhealed shard increments the aggregate total',async t=>{
  const f=fixture(t);f.records.set('shards/target',{healed:false});f.records.set('metadata/public_room_stats',{healedShards:4,other:7});
  assert.deepEqual(await f.handlers.reactToRoomContent(req('shard')),{accepted:true,healed:true,changed:true});
  assert.deepEqual(f.records.get('metadata/public_room_stats'),{healedShards:5,other:7,updatedAt:'server-time'});
  t.mock.timers.setTime(NOW+48*3600000);
  assert.deepEqual(await f.handlers.reactToRoomContent(req('shard')),{accepted:true,healed:true,changed:false});
  assert.equal(f.records.get('metadata/public_room_stats').healedShards,5);
});

test('failed reaction commit leaves content, counters and receipt unchanged',async t=>{
  const f=fixture(t,{fail:true});f.records.set('shards/target',{healed:false});
  await assert.rejects(f.handlers.reactToRoomContent(req('shard')),/commit failed/);
  assert.equal(f.records.size,1);assert.equal(f.records.get('shards/target').healed,false);
  assert.deepEqual(f.writes,[]);assert.deepEqual(f.logs,[]);
});
