import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoulAutoBackup, createSoulSyncUI } from '../soul-sync-controller.mjs';

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}
function fixture(overrides = {}) {
    const calls = [];
    const backup = createSoulAutoBackup({
        getKey:() => 'key', getJourney:() => ({ counters:{e:2} }),
        readSoulBackup:async key => { calls.push(['read',key]); return { journey:{counters:{m:3}},letters:[{content:'letter'}],legacy:true }; },
        writeSoulBackup:async (...args) => { calls.push(['write',...args]); },
        retireLegacySoulBackup:async key => { calls.push(['retire',key]); },
        onError:error => calls.push(['error',error.message]),
        ...overrides
    });
    return { backup, calls };
}

test('no key skips all cloud operations', async () => {
    const f=fixture({getKey:()=>null});
    assert.equal(await f.backup(),false); assert.deepEqual(f.calls,[]);
});

test('automatic backups serialize full read-write-cleanup cycles and use the latest journey', async () => {
    const gate=deferred(), entered=deferred(), order=[];
    let key='first', journey={counters:{e:1}}, reads=0;
    const {backup}=fixture({getKey:()=>key,getJourney:()=>journey,
        readSoulBackup:async k=>{order.push(['read',k]); if(++reads===1){entered.resolve();await gate.promise;} return {journey:{counters:{m:4}},letters:['saved'],legacy:true};},
        writeSoulBackup:async (...args)=>order.push(['write',...args]),
        retireLegacySoulBackup:async k=>order.push(['retire',k])
    });
    const first=backup(); await entered.promise;
    key='second'; const second=backup(); key='third';
    journey={counters:{e:5}};
    assert.deepEqual(order,[['read','first']]); gate.resolve();
    assert.deepEqual(await Promise.all([first,second]),[true,true]);
    assert.deepEqual(order.map(call=>call.slice(0,2)),[['read','first'],['write','first'],['retire','first'],['read','second'],['write','second'],['retire','second']]);
    assert.equal(order[1][2].counters.e,5); assert.equal(order[1][2].counters.m,4);
    assert.deepEqual(order[1][3],['saved']);
});

test('read failure returns false and the next queued backup still succeeds', async () => {
    let reads=0;
    const f=fixture({readSoulBackup:async()=>{if(++reads===1)throw new Error('offline');return null;}});
    assert.deepEqual(await Promise.all([f.backup(),f.backup()]),[false,true]);
    assert.equal(f.calls.filter(x=>x[0]==='write').length,1);
    assert.equal(f.calls.filter(x=>x[0]==='retire').length,0);
    assert.deepEqual(f.calls[0],['error','offline']);
});

test('failed write does not retire legacy data and a later backup retries', async () => {
    let writes=0;
    const f=fixture({writeSoulBackup:async()=>{if(++writes===1)throw new Error('write failed');}});
    assert.equal(await f.backup(),false);
    assert.equal(f.calls.some(x=>x[0]==='retire'),false);
    assert.equal(await f.backup(),true);
    assert.equal(f.calls.filter(x=>x[0]==='retire').length,1);
});

test('sync UI is safe on pages without Room H controls', () => {
    const update=createSoulSyncUI({getElement:()=>null,getKey:()=>{throw new Error('should not read');},checkFutureLetters:()=>{throw new Error('should not check');}});
    assert.doesNotThrow(update);
});

test('sync UI resolves current key and controls on every refresh', () => {
    const elements=Object.fromEntries(['sync-initial-actions','sync-active-actions','future-letter-box','active-key-display'].map(id=>[id,{style:{},textContent:''}]));
    let key=null,checks=0;
    const update=createSoulSyncUI({getElement:id=>elements[id],getKey:()=>key,checkFutureLetters:()=>checks++});
    update(); assert.equal(elements['sync-initial-actions'].style.display,'flex'); assert.equal(checks,0);
    key='EMP-example'; update();
    assert.equal(elements['sync-active-actions'].style.display,'flex');
    assert.equal(elements['sync-initial-actions'].style.display,'none');
    assert.equal(elements['future-letter-box'].style.display,'block');
    assert.equal(elements['active-key-display'].textContent,key); assert.equal(checks,1);
    delete elements['future-letter-box']; delete elements['active-key-display'];
    assert.doesNotThrow(update);
    key=null; update(); assert.equal(elements['sync-active-actions'].style.display,'none');
});
