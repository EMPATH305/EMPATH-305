import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decryptSoulPayload,
  encryptSoulPayload,
  isEncryptedSoulRecord,
  soulStorageId
} from '../soul-crypto.mjs';

const soulKey = 'EMP-00112233-44556677-8899AABB-CCDDEEFF';

test('Soul records use a deterministic opaque storage ID', async () => {
  const first = await soulStorageId(soulKey);
  const second = await soulStorageId(soulKey.toLowerCase());
  assert.equal(first, second);
  assert.match(first, /^sj_[a-f0-9]{64}$/);
  assert(!first.includes('00112233'));
});

test('Soul payloads round-trip without exposing plaintext', async () => {
  const payload = {
    journey:{ counters:{ e:1, m:0, p:0, a:0, t:0 }, events:[{ type:'e', text:'private words', time:'22:10' }] },
    letters:[{ content:'hello, future me', createdAt:1, unlockDate:2 }]
  };
  const encrypted = await encryptSoulPayload(soulKey, payload);
  assert.equal(isEncryptedSoulRecord(encrypted.record), true);
  assert(!JSON.stringify(encrypted.record).includes('private words'));
  assert(!JSON.stringify(encrypted.record).includes('future me'));
  assert.deepEqual(await decryptSoulPayload(soulKey, encrypted.record), payload);
});

test('Soul ciphertext is authenticated against tampering and the wrong key', async () => {
  const encrypted = await encryptSoulPayload(soulKey, { journey:{ counters:{} }, letters:[] });
  const replacement = encrypted.record.ciphertext[0] === 'A' ? 'B' : 'A';
  const tampered = { ...encrypted.record, ciphertext:`${replacement}${encrypted.record.ciphertext.slice(1)}` };
  await assert.rejects(() => decryptSoulPayload(soulKey, tampered), /could not be decrypted/);
  await assert.rejects(
    () => decryptSoulPayload('EMP-FFEEDDCC-BBAA9988-77665544-33221100', encrypted.record),
    /could not be decrypted/
  );
});
