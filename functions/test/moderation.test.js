'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createModeration}=require('../lib/moderation');
class HttpsError extends Error { constructor(code,message){super(message);this.code=code;} }
const NOW=1800000000000;
const admin={auth:{uid:'moderator',token:{admin:true}},app:{appId:'test'}};
const req=(data={})=>({...admin,data});
function fixture(t,{fail=false,page=[]}={}) {
  t.mock.timers.enable({apis:['Date'],now:NOW});
  const records=new Map(),calls=[],logs=[];let sequence=0;
  const snap=(id,data)=>({id,exists:data!==undefined,data:()=>data});
  const query={where(...args){calls.push(['where',...args]);return this;},orderBy(...args){calls.push(['orderBy',...args]);return this;},startAfter(...args){calls.push(['startAfter',...args]);return this;},limit(n){calls.push(['limit',n]);return this;},async get(){return {docs:page.map(([id,data])=>snap(id,data))};}};
  const db={collection(name){calls.push(['collection',name]);return {...query,doc(id='audit-'+(++sequence)){const path=name+'/'+id;return {path,async get(){calls.push(['get',path]);return snap(id,records.get(path));}};}};},async runTransaction(fn){
    const pending=[];
    await fn({get:async ref=>snap(ref.path,records.get(ref.path)),delete:ref=>pending.push(['delete',ref.path]),update:(ref,data)=>pending.push(['update',ref.path,data]),set:(ref,data)=>pending.push(['set',ref.path,data])});
    if(fail)throw new Error('commit failed');
    for(const [action,path,data] of pending){if(action==='delete')records.delete(path);else records.set(path,action==='update'?{...records.get(path),...data}:data);}
  }};
  const handlers=createModeration({db,HttpsError,FieldPath:{documentId:()=> '__name__'},FieldValue:{serverTimestamp:()=> 'server-time'},Timestamp:{fromMillis:ms=>({toMillis:()=>ms})},logger:{info:(...args)=>logs.push(args)},ADMIN_APP_CHECK_ENFORCED:true,MODERATION_AUDIT_RETENTION_MS:365*86400000});
  return {handlers,records,calls,logs};
}
const report={status:'open',targetCollection:'emotions',targetId:'post',reason:'spam',createdAt:{toMillis:()=>NOW},appVerified:true};

test('both moderation handlers require an authenticated admin before data access',async t=>{
  const f=fixture(t);
  for(const name of ['listReports','moderateReport']){
    await assert.rejects(f.handlers[name]({}),{code:'unauthenticated'});
    await assert.rejects(f.handlers[name]({auth:{uid:'visitor',token:{admin:false}}}),{code:'permission-denied'});
  }
  assert.deepEqual(f.calls,[]);
});

test('report listing uses stable cursor, lookahead and bounded preview',async t=>{
  const f=fixture(t,{page:[['r1',report],['r2',{...report,targetId:'image'}],['r3',report]]});
  f.records.set('emotions/post',{text:'x'.repeat(600)});f.records.set('emotions/image',{image:'private-image-payload'});
  const result=await f.handlers.listReports(req({limit:2,cursor:{createdAt:NOW+1,id:'previous'}}));
  assert.equal(result.reports.length,2);assert.equal(result.reports[0].preview.length,500);
  assert.equal(result.reports[1].preview,'[image-only submission]');assert.equal(result.hasMore,true);
  assert.deepEqual(result.nextCursor,{id:'r2',createdAt:NOW});assert.deepEqual(result.security,{appCheckVerified:true,appCheckEnforced:true});
  assert(f.calls.some(x=>x[0]==='where'&&x[1]==='status'&&x[3]==='open'));
  assert(f.calls.some(x=>x[0]==='orderBy'&&x[1]==='__name__'&&x[2]==='desc'));
  assert(f.calls.some(x=>x[0]==='limit'&&x[1]===3));
  const cursor=f.calls.find(x=>x[0]==='startAfter');assert.equal(cursor[1].toMillis(),NOW+1);assert.equal(cursor[2],'previous');
  assert.equal(f.calls.filter(x=>x[0]==='get').length,2);
});

test('listing handles missing or disallowed targets without reading private collections',async t=>{
  const f=fixture(t,{page:[['r1',report],['r2',{...report,targetCollection:'user_journeys'}]]});
  const result=await f.handlers.listReports(req());
  assert.equal(result.hasMore,false);assert.equal(result.nextCursor,null);
  assert.equal(result.reports[0].preview,'[content already removed]');assert.equal(result.reports[1].targetCollection,'');
  assert(!f.calls.some(x=>x[0]==='collection'&&x[1]==='user_journeys'));
});

test('dismiss keeps content; remove deletes it and records a bounded audit',async t=>{
  const f=fixture(t);
  for(const action of ['dismiss','remove']){
    f.records.clear();f.records.set('content_reports/report',report);f.records.set('emotions/post',{text:'private text'});
    assert.deepEqual(await f.handlers.moderateReport(req({reportId:'report',action})),{completed:true});
    assert.equal(f.records.has('emotions/post'),action==='dismiss');
    assert.equal(f.records.get('content_reports/report').status,action==='dismiss'?'dismissed':'removed');
    const audit=[...f.records.entries()].find(([key])=>key.startsWith('moderation_audit/'))[1];
    assert.equal(audit.moderatorUid,'moderator');assert.equal(audit.expireAt.toMillis(),NOW+365*86400000);
    assert(!JSON.stringify(audit).includes('private text'));
    await assert.rejects(f.handlers.moderateReport(req({reportId:'report',action})),{code:'failed-precondition'});
  }
});

test('invalid actions, missing reports and unsafe removal targets fail without mutation',async t=>{
  const f=fixture(t);
  await assert.rejects(f.handlers.moderateReport(req({reportId:'report',action:'unknown'})),{code:'invalid-argument'});
  await assert.rejects(f.handlers.moderateReport(req({reportId:'report',action:'remove'})),{code:'not-found'});
  f.records.set('content_reports/report',{...report,targetCollection:'user_journeys'});
  await assert.rejects(f.handlers.moderateReport(req({reportId:'report',action:'remove'})),{code:'failed-precondition'});
  assert.equal(f.records.size,1);assert.equal(f.records.get('content_reports/report').status,'open');assert.deepEqual(f.logs,[]);
});

test('failed moderation commit keeps report and content and emits no success log',async t=>{
  const f=fixture(t,{fail:true});f.records.set('content_reports/report',report);f.records.set('emotions/post',{text:'kept'});
  await assert.rejects(f.handlers.moderateReport(req({reportId:'report',action:'remove'})),/commit failed/);
  assert.equal(f.records.size,2);assert.equal(f.records.get('content_reports/report').status,'open');assert.deepEqual(f.logs,[]);
});
