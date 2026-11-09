import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoulBackupService } from '../soul-backup-service.mjs';
import { mergeJourneys, mergeSoulLetters } from '../soul-model.mjs';
import { soulStorageId } from '../soul-crypto.mjs';

const key = 'EMP-00112233-44556677-8899AABB-CCDDEEFF';
const letter = { content:'future words', createdAt:1, unlockDate:2 };
function fixture() {
  const records = new Map(), reads = [], writes = [], retired = [], errors = [];
  const service = createSoulBackupService({
    readRecord:async id => { reads.push(id); return { exists:() => records.has(id), data:() => records.get(id) }; },
    writeRecord:async (id, record) => { writes.push(id); records.set(id, record); },
    serverTimestamp:() => 'server-time', now:() => 123,
    retireLegacy:async payload => retired.push(payload), onCleanupError:error => errors.push(error)
  });
  return { ...service, records, reads, writes, retired, errors };
}

test('Soul backup round trip uses opaque IDs and encrypted content with existing metadata', async () => {
  const f = fixture();
  const id = await f.writeSoulBackup(key, { counters:{e:3}, events:[{type:'e',text:'private words',time:'10:00'}] }, [letter]);
  assert.match(id, /^sj_[a-f0-9]{64}$/);
  const record = f.records.get(id);
  assert.equal(record.clientUpdatedAt,123); assert.equal(record.updatedAt,'server-time');
  assert(!JSON.stringify(record).includes('private words')); assert(!JSON.stringify(record).includes('future words'));
  const result = await f.readSoulBackup(key);
  assert.equal(result.legacy,false); assert.equal(result.journey.counters.e,3);
  assert.deepEqual(result.letters,[letter]); assert.deepEqual(f.reads,[id]);
});

test('legacy fallback occurs only when the encrypted record is absent', async () => {
  const f = fixture();
  f.records.set(key,{ counters:{m:4},letters:[letter] });
  const result = await f.readSoulBackup(key);
  assert.equal(result.legacy,true); assert.equal(result.journey.counters.m,4);
  assert.deepEqual(result.letters,[letter]); assert.deepEqual(f.reads,[await soulStorageId(key),key]);
  assert.equal(f.writes.length,0); assert.equal(f.retired.length,0);
});

test('missing backups return null and invalid encrypted backups never fall back to plaintext', async () => {
  const f = fixture(); assert.equal(await f.readSoulBackup(key),null);
  const id = await soulStorageId(key); f.records.set(id,{schemaVersion:99}); f.reads.length=0;
  await assert.rejects(f.readSoulBackup(key), /Unsupported/);
  assert.deepEqual(f.reads,[id]); assert.equal(f.writes.length,0);
});

test('tampered encrypted backups reject without legacy fallback or writes', async () => {
  const f = fixture(); const id = await f.writeSoulBackup(key,{});
  const record=f.records.get(id); record.ciphertext=(record.ciphertext[0]==='A'?'B':'A')+record.ciphertext.slice(1);
  f.writes.length=0;
  await assert.rejects(f.readSoulBackup(key), /could not be decrypted/);
  assert.deepEqual(f.reads,[id]); assert.equal(f.writes.length,0);
});

test('failed writes propagate and cleanup failure does not invalidate a saved backup', async () => {
  const errors=[];
  const service=createSoulBackupService({writeRecord:async()=>{throw new Error('write offline');},serverTimestamp:()=>0,retireLegacy:async()=>{throw new Error('cleanup offline');},onCleanupError:error=>errors.push(error.message)});
  await assert.rejects(service.writeSoulBackup(key,{}),/write offline/);
  await service.retireLegacySoulBackup(key);
  assert.deepEqual(errors,['cleanup offline']);
});

test('journey merge preserves both event sets and maximum counters without mutating inputs', () => {
  const event={type:'e',text:'one',time:'10:00'};
  const local={counters:{e:3,m:1},events:[event,{type:'m',text:'two',time:'11:00'}],visitCount:4};
  const cloud={counters:{e:2,m:5},events:[event],visitCount:6};
  const before=JSON.stringify([local,cloud]); const merged=mergeJourneys(local,cloud);
  assert.deepEqual(merged.counters,{e:3,m:5,p:0,a:0,t:0});
  assert.equal(merged.events.length,2); assert.equal(merged.visitCount,6);
  assert.equal(JSON.stringify([local,cloud]),before);
  const many=Array.from({length:510},(_,i)=>({type:'e',text:String(i),time:'10:00'}));
  assert.equal(mergeJourneys({events:many},{}).events.length,500);
});

test('letter merge deduplicates, sorts and retains the newest fifty valid letters', () => {
  const letters=Array.from({length:55},(_,i)=>({...letter,createdAt:i+1}));
  const merged=mergeSoulLetters(letters,[letters[54],null,{content:'invalid'}]);
  assert.equal(merged.length,50); assert.equal(merged[0].createdAt,6); assert.equal(merged[49].createdAt,55);
});
