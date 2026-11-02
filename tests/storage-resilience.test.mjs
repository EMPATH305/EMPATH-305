import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeSubmissionRequest,
  createSafeStorage,
  getOrCreateSubmissionRequest
} from '../storage-resilience.mjs';

function memoryStorage() {
  const values = new Map();
  return {
    getItem:key => values.get(String(key)) ?? null,
    setItem:(key, value) => values.set(String(key), String(value)),
    removeItem:key => values.delete(String(key)),
    values
  };
}

function deterministicCrypto() {
  let fill = 1;
  return {
    subtle:globalThis.crypto.subtle,
    getRandomValues(bytes) {
      bytes.fill(fill);
      fill += 1;
      return bytes;
    }
  };
}

test('safe storage falls back to memory when browser storage throws', () => {
  const blocked = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); }
  };
  const storage = createSafeStorage(blocked);
  assert.equal(storage.setItem('journey', 'kept'), false);
  assert.equal(storage.getItem('journey'), 'kept');
  assert.equal(storage.removeItem('journey'), false);
  assert.equal(storage.getItem('journey'), null);
});

test('an uncertain retry reuses one request ID for the same normalized payload', async () => {
  const native = memoryStorage();
  const storage = createSafeStorage(native);
  const cryptoApi = deterministicCrypto();
  const options = { now:1_800_000_000_000, cryptoApi };
  const first = await getOrCreateSubmissionRequest(storage, 'm', { text:'still here' }, options);
  const retry = await getOrCreateSubmissionRequest(storage, 'm', { text:'still here' }, options);
  const changed = await getOrCreateSubmissionRequest(storage, 'm', { text:'different' }, options);
  const originalAfterChange = await getOrCreateSubmissionRequest(storage, 'm', { text:'still here' }, options);

  assert.match(first.requestId, /^[a-f0-9]{32}$/);
  assert.equal(retry.requestId, first.requestId);
  assert.equal(retry.reused, true);
  assert.notEqual(changed.requestId, first.requestId);
  assert.equal(originalAfterChange.requestId, first.requestId);
});

test('pending records contain only a fingerprint and are removed after acceptance', async () => {
  const native = memoryStorage();
  const storage = createSafeStorage(native);
  const options = { now:1_800_000_000_000, cryptoApi:deterministicCrypto() };
  const pending = await getOrCreateSubmissionRequest(storage, 'e', {
    text:'private words',
    image:'data:image/webp;base64,PRIVATE_IMAGE'
  }, options);
  const serialized = native.getItem('empath_pending_room_submissions_v1');

  assert(!serialized.includes('private words'));
  assert(!serialized.includes('PRIVATE_IMAGE'));
  assert.equal(completeSubmissionRequest(storage, 'e', pending.requestId, options), true);
  assert.equal(native.getItem('empath_pending_room_submissions_v1'), null);
});

test('expired pending request IDs are not reused', async () => {
  const native = memoryStorage();
  const storage = createSafeStorage(native);
  const cryptoApi = deterministicCrypto();
  const first = await getOrCreateSubmissionRequest(storage, 't', { text:'warmth' }, {
    now:1_800_000_000_000,
    cryptoApi
  });
  const expired = await getOrCreateSubmissionRequest(storage, 't', { text:'warmth' }, {
    now:1_800_000_000_000 + (48 * 60 * 60 * 1000),
    cryptoApi
  });
  assert.notEqual(expired.requestId, first.requestId);
});
