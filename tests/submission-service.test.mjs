import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubmissionService } from '../submission-service.mjs';
import { createSafeStorage } from '../storage-resilience.mjs';

function storage() {
  const values = new Map();
  return createSafeStorage({
    getItem:key => values.get(key) ?? null,
    setItem:(key, value) => values.set(key, value),
    removeItem:key => values.delete(key)
  });
}

const accepted = { accepted:true, id:'saved', deletionToken:'receipt', deletionExpiresAt:1800000000000 };

test('network failure and invalid acceptance preserve the same request for retry', async () => {
  const calls = [];
  const service = createSubmissionService({ storage:storage(), submitRoomContent:async payload => {
    calls.push(payload);
    if (calls.length === 1) throw new Error('offline');
    if (calls.length === 2) return { data:{ accepted:true, id:'' } };
    return { data:{ accepted:true, id:'saved' } };
  } });
  await assert.rejects(service.createRoomContent('p', { text:'keep this' }), /offline/);
  await assert.rejects(service.createRoomContent('p', { text:'keep this' }), /not accepted/);
  assert.equal(await service.createRoomContent('p', { text:'keep this' }), 'saved');
  assert.equal(new Set(calls.map(call => call.requestId)).size, 1);
  assert(calls.every(call => call.room === 'p' && call.text === 'keep this'));
  await service.createRoomContent('p', { text:'keep this' });
  assert.notEqual(calls[3].requestId, calls[0].requestId);
});

test('failed receipt storage keeps the request until a deduplicated retry saves the receipt', async () => {
  const calls = [], receipts = [], refreshes = [];
  let canStore = false;
  const service = createSubmissionService({ storage:storage(),
    submitRoomContent:async payload => { calls.push(payload); return { data:{ ...accepted, deduplicated:calls.length > 1 } }; },
    rememberOwnedContent:(...args) => { receipts.push(args); return canStore; },
    onReceiptStored:room => refreshes.push(room)
  });
  assert.equal(await service.createRoomContent('t', { text:'warmth' }), 'saved');
  assert.deepEqual(refreshes, []);
  canStore = true;
  const result = await service.createRoomContent('t', { text:'warmth' }, true);
  assert.equal(result.deduplicated, true);
  assert.equal(calls[0].requestId, calls[1].requestId);
  assert.deepEqual(receipts[1], ['warmth', 'saved', 'receipt', accepted.deletionExpiresAt]);
  assert.deepEqual(refreshes, ['t']);
  await service.createRoomContent('t', { text:'warmth' });
  assert.notEqual(calls[2].requestId, calls[1].requestId);
});

test('receipt collection mapping and full-result contract remain unchanged', async () => {
  for (const [room, collection] of Object.entries({ e:'emotions', m:'stars', p:'shards', t:'warmth' })) {
    const events = [];
    const service = createSubmissionService({ storage:storage(), submitRoomContent:async () => ({ data:accepted }),
      rememberOwnedContent:(kind, id) => { events.push([kind, id]); return true; },
      onReceiptStored:kind => events.push(kind)
    });
    assert.equal(await service.createRoomContent(room, {}, true), accepted);
    assert.deepEqual(events, [[collection, 'saved'], room]);
  }
});

test('Room A and tokenless legacy responses complete without a deletion receipt', async () => {
  const calls = [];
  const service = createSubmissionService({ storage:storage(),
    submitRoomContent:async payload => { calls.push(payload); return { data:{ accepted:true, id:'sand', witness:{ totalBefore:10 } } }; },
    rememberOwnedContent:() => assert.fail('No receipt expected')
  });
  const payload = { text:'release', lifespan:3600000, weightKind:'unnamed' };
  assert.deepEqual((await service.createRoomContent('a', payload, true)).witness, { totalBefore:10 });
  await service.createRoomContent('a', payload);
  assert.notEqual(calls[0].requestId, calls[1].requestId);
  assert.equal(calls[0].lifespan, payload.lifespan);
});
