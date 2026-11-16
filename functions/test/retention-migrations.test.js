'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createRetentionMigrations}=require('../lib/retention-migrations');
class HttpsError extends Error {constructor(code,message){super(message);this.code=code;}}
const NOW=1800000000000,DAY=86400000;
const stamp=ms=>({toMillis:()=>ms});
const cases=[['initializePublicRetention','public-retention-v1','public_retention_v1'],['initializeModerationRetention','moderation-retention-v1','moderation_retention_v1']];
function fixture(t,{blocked=false}={}){
  t.mock.timers.enable({apis:['Date'],now:NOW});
  const records=new Map(),calls=[],logs=[];let failWriter=false;
  const apply=(path,data,merge)=>{const result=merge?{...records.get(path)}:{};for(const [key,value] of Object.entries(data)){if(value==='DELETE')delete result[key];else result[key]=value;}records.set(path,result);};
  const ref=path=>({path,get:async()=>snap(path),set:async(data,options)=>apply(path,data,options?.merge)});
  const snap=path=>({ref:ref(path),exists:records.has(path),data:()=>records.get(path)});
  const db={collection(name){calls.push(['collection',name]);return {doc:id=>ref(name+'/'+id),select(...fields){calls.push(['select',name,fields]);return {async get(){const docs=[...records.keys()].filter(path=>path.startsWith(name+'/')).map(snap);return {docs,size:docs.length,forEach:fn=>docs.forEach(fn)};}};}};},
    async runTransaction(fn){const pending=[];await fn({get:async r=>snap(r.path),set:(r,data,options)=>pending.push([r.path,data,options?.merge])});for(const args of pending)apply(...args);},
    bulkWriter(){const pending=[];return {update:(r,data)=>pending.push([r.path,data,true]),async close(){if(failWriter)throw new Error('bulk write failed');for(const args of pending)apply(...args);}};}};
  const handlers=createRetentionMigrations({db,HttpsError,FieldValue:{serverTimestamp:()=> 'server-time',delete:()=> 'DELETE'},Timestamp:{fromMillis:stamp},logger:{info:(...args)=>logs.push(args)},enforceRetentionMigrationLimit:async()=>{calls.push(['limit']);if(blocked)throw new HttpsError('resource-exhausted','limit');},PUBLIC_CONTENT_RETENTION_MS:180*DAY,CONTENT_REPORT_RETENTION_MS:180*DAY,MODERATION_AUDIT_RETENTION_MS:365*DAY});
  return {handlers,records,calls,logs,setFail:value=>{failWriter=value;}};
}

test('retention inputs and rate limits prevent data migration',async t=>{
  const f=fixture(t,{blocked:true});
  for(const [name,id] of cases){
    await assert.rejects(f.handlers[name]({data:{migrationId:'wrong'}}),{code:'invalid-argument'});
    await assert.rejects(f.handlers[name]({data:{migrationId:id}}),{code:'resource-exhausted'});
  }
  assert.deepEqual(f.calls,[['limit'],['limit']]);assert.equal(f.records.size,0);
});

test('completed retention migrations skip all collection scans',async t=>{
  const f=fixture(t);
  for(const [name,id,marker] of cases){
    f.records.set('metadata/'+marker,{completed:true});
    const result=await f.handlers[name]({data:{migrationId:id}});
    assert.equal(result.alreadyCompleted,true);assert.equal(result.completed,true);
  }
  assert(!f.calls.some(call=>call[0]==='select'));assert.deepEqual(f.logs,[]);
});

test('active migration locks block work',async t=>{
  const f=fixture(t);
  for(const [name,id,marker] of cases){
    f.records.set('metadata/'+marker,{lockUntil:stamp(NOW+1)});
    await assert.rejects(f.handlers[name]({data:{migrationId:id}}),{code:'resource-exhausted'});
  }
  assert(!f.calls.some(call=>call[0]==='select'));assert.deepEqual(f.logs,[]);
});

test('public retention backfills only absent expiry and initializes counters',async t=>{
  const f=fixture(t);
  f.records.set('emotions/old',{createdAt:stamp(NOW-DAY)});
  f.records.set('stars/existing',{expireAt:stamp(NOW+123)});
  f.records.set('shards/healed',{healed:true});f.records.set('shards/unhealed',{healed:false});
  const result=await f.handlers.initializePublicRetention({data:{migrationId:'public-retention-v1'}});
  assert.equal(result.backfilled,3);assert.deepEqual(result.stats,{emotions:1,stars:1,shards:2,healedShards:1,warmth:0});
  assert.equal(f.records.get('emotions/old').expireAt.toMillis(),NOW+179*DAY);
  assert.equal(f.records.get('stars/existing').expireAt.toMillis(),NOW+123);
  assert.equal(f.records.get('shards/healed').expireAt.toMillis(),NOW+180*DAY);
  const marker=f.records.get('metadata/public_retention_v1');assert.equal(marker.completed,true);assert(!('lockUntil' in marker));
  const again=await f.handlers.initializePublicRetention({data:{migrationId:'public-retention-v1'}});assert.equal(again.alreadyCompleted,true);assert.equal(again.stats.healedShards,1);
  for(const call of f.calls.filter(x=>x[0]==='select'))assert.deepEqual(call[2],['createdAt','expireAt','healed']);
});

test('moderation retention uses separate report and audit windows',async t=>{
  const f=fixture(t);f.records.set('content_reports/old',{createdAt:stamp(NOW-DAY)});f.records.set('moderation_audit/old',{});f.records.set('content_reports/kept',{expireAt:stamp(NOW+1)});
  const result=await f.handlers.initializeModerationRetention({data:{migrationId:'moderation-retention-v1'}});
  assert.deepEqual(result.backfilled,{contentReports:1,moderationAudit:1});
  assert.equal(f.records.get('content_reports/old').expireAt.toMillis(),NOW+179*DAY);
  assert.equal(f.records.get('moderation_audit/old').expireAt.toMillis(),NOW+365*DAY);
  assert.equal(f.records.get('content_reports/kept').expireAt.toMillis(),NOW+1);
  assert.equal(f.records.get('metadata/moderation_retention_v1').completed,true);
  for(const call of f.calls.filter(x=>x[0]==='select'))assert.deepEqual(call[2],['createdAt','expireAt']);
});

test('bulk failure never marks complete and retry succeeds after lock expiry',async t=>{
  const f=fixture(t);
  for(const [name,id,marker] of cases){
    f.records.clear();f.logs.length=0;t.mock.timers.setTime(NOW);f.setFail(true);
    await assert.rejects(f.handlers[name]({data:{migrationId:id}}),/bulk write failed/);
    assert.equal(f.records.get('metadata/'+marker).completed,false);assert.deepEqual(f.logs,[]);
    f.setFail(false);
    await assert.rejects(f.handlers[name]({data:{migrationId:id}}),{code:'resource-exhausted'});
    t.mock.timers.setTime(NOW+300000);
    assert.equal((await f.handlers[name]({data:{migrationId:id}})).completed,true);
  }
});
