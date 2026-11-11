import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSoulActions } from '../soul-actions.mjs';

const localEvent={type:'e',text:'local',time:'10:00'};
const cloudEvent={type:'m',text:'cloud',time:'11:00'};
const oldLetter={content:'older letter',createdAt:1,unlockDate:2};
function fixture(overrides={}) {
    const calls=[];
    let journey={counters:{e:2},events:[localEvent]},key='original';
    const cloud={journey:{counters:{m:3},events:[cloudEvent]},letters:[oldLetter],legacy:true};
    const actions=createSoulActions({
        getJourney:()=>journey,
        applyJourney:value=>{calls.push('apply');journey=value;},
        setKey:value=>{calls.push('set-key');key=value;},
        removeKey:()=>{calls.push('remove-key');key=null;},
        readSoulBackup:async()=>{calls.push('read');return cloud;},
        writeSoulBackup:async(...args)=>calls.push(['write',...args]),
        retireLegacySoulBackup:async()=>calls.push('retire'),
        deleteSoulJourney:async payload=>{calls.push(['delete',payload]);return {data:{completed:true}};},
        now:()=>100,
        ...overrides
    });
    return {actions,calls,get journey(){return journey;},get key(){return key;}};
}

test('manual loading merges local footprints before saving and retiring legacy data', async()=>{
    const f=fixture(); assert.equal(await f.actions.loadExistingKey('loaded'),true);
    assert.deepEqual(f.calls.map(x=>Array.isArray(x)?x[0]:x),['read','apply','set-key','write','retire']);
    assert.equal(f.key,'loaded'); assert.deepEqual(f.journey.events,[cloudEvent,localEvent]);
    assert.deepEqual(f.journey.counters,{e:2,m:3,p:0,a:0,t:0});
    assert.deepEqual(f.calls[3],['write','loaded',f.journey,[oldLetter]]);
});

test('missing key leaves local state untouched', async()=>{
    const f=fixture({readSoulBackup:async()=>null});
    assert.equal(await f.actions.loadExistingKey('missing'),false);
    assert.equal(f.key,'original');assert.deepEqual(f.journey.events,[localEvent]);assert.deepEqual(f.calls,[]);
});

test('read failure preserves local state and does not save or clean up', async()=>{
    const f=fixture({readSoulBackup:async()=>{throw new Error('offline');}});
    await assert.rejects(f.actions.loadExistingKey('loaded'),/offline/);
    assert.equal(f.key,'original');assert.deepEqual(f.journey.events,[localEvent]);assert.deepEqual(f.calls,[]);
});

test('failed manual write retains the merged local journey without retiring the old backup', async()=>{
    const f=fixture({writeSoulBackup:async()=>{throw new Error('write failed');}});
    await assert.rejects(f.actions.loadExistingKey('loaded'),/write failed/);
    assert.deepEqual(f.journey.events,[cloudEvent,localEvent]);assert.equal(f.key,'loaded');
    assert(!f.calls.includes('retire'));
});

test('letter sealing preserves existing letters and merges footprints without replacing local state', async()=>{
    const f=fixture(); await f.actions.sealFutureLetter('key','new letter',200);
    const write=f.calls[1];assert.equal(write[0],'write');assert.equal(write[1],'key');
    assert.deepEqual(write[2].events,[cloudEvent,localEvent]);
    assert.deepEqual(write[3],[oldLetter,{content:'new letter',createdAt:100,unlockDate:200}]);
    assert.deepEqual(f.journey.events,[localEvent]);assert.equal(f.calls[2],'retire');
});

test('letter sealing supports a new backup and propagates write failure without cleanup', async()=>{
    const fresh=fixture({readSoulBackup:async()=>null});
    await fresh.actions.sealFutureLetter('new','first',200);
    assert.equal(fresh.calls[0][3].length,1);assert(!fresh.calls.includes('retire'));
    const failed=fixture({writeSoulBackup:async()=>{throw new Error('offline');}});
    await assert.rejects(failed.actions.sealFutureLetter('key','draft',200),/offline/);
    assert(!failed.calls.includes('retire'));
});

test('deletion removes only the key after server confirmation and preserves local footprints', async()=>{
    const f=fixture();await f.actions.deleteConfirmedBackup('key');
    assert.deepEqual(f.calls,[['delete',{soulKey:'key'}],'remove-key']);
    assert.equal(f.key,null);assert.deepEqual(f.journey.events,[localEvent]);
    for(const response of [undefined,{data:{completed:false}}]) {
        const incomplete=fixture({deleteSoulJourney:async()=>response});
        await assert.rejects(incomplete.actions.deleteConfirmedBackup('key'),/not completed/);
        assert.equal(incomplete.key,'original');assert.deepEqual(incomplete.calls,[]);
    }
    const failed=fixture({deleteSoulJourney:async()=>{throw new Error('offline');}});
    await assert.rejects(failed.actions.deleteConfirmedBackup('key'),/offline/);
    assert.equal(failed.key,'original');
});

test('UI retains confirmation and only clears the letter input after successful sealing',()=>{
    const source=readFileSync(new URL('../firebase-app.js',import.meta.url),'utf8');
    const submit=source.split('window.submitFutureLetter = async function()')[1].split('window.checkFutureLetters')[0];
    assert(submit.indexOf('await soulActions.sealFutureLetter')<submit.indexOf("document.getElementById('future-letter-input').value = ''"));
    assert(!submit.split('catch(e)')[1].includes(".value = ''"));
    const deletion=source.split('window.deleteSoulBackup = async function()')[1].split('// 2. Room A')[0];
    assert(deletion.indexOf('if (!confirmed) return')<deletion.indexOf('await soulActions.deleteConfirmedBackup'));
});
