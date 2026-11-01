const SOUL_KEY_PATTERN = /^(?:EMP-[A-Z0-9]{4,12}-[A-Z0-9]{4,12}|EMP-(?:[A-Z0-9]{8}-){3}[A-Z0-9]{8})$/;
const FORMAT_VERSION = 3;
const PBKDF2_ITERATIONS = 210_000;
const MAX_CIPHERTEXT_CHARS = 750_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cryptoApi() {
  const api = globalThis.crypto;
  if (!api?.subtle || !api?.getRandomValues) throw new Error('Secure browser encryption is unavailable.');
  return api;
}

function normalizeSoulKey(soulKey) {
  const normalized = String(soulKey || '').trim().toUpperCase();
  if (!SOUL_KEY_PATTERN.test(normalized)) throw new Error('Invalid Soul Key.');
  return normalized;
}

function toBase64Url(bytes) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value, maxChars = MAX_CIPHERTEXT_CHARS) {
  if (typeof value !== 'string' || !value || value.length > maxChars || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Invalid encrypted Soul record.');
  }
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function soulStorageId(soulKey) {
  const normalized = normalizeSoulKey(soulKey);
  const digest = await cryptoApi().subtle.digest('SHA-256', encoder.encode(`EMPATH-SOUL-ID:${normalized}`));
  return `sj_${bytesToHex(new Uint8Array(digest))}`;
}

async function deriveEncryptionKey(soulKey, salt, usage) {
  const material = await cryptoApi().subtle.importKey(
    'raw',
    encoder.encode(normalizeSoulKey(soulKey)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return cryptoApi().subtle.deriveKey({
    name:'PBKDF2',
    salt,
    iterations:PBKDF2_ITERATIONS,
    hash:'SHA-256'
  }, material, { name:'AES-GCM', length:256 }, false, [usage]);
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid Soul payload.');
  const serialized = JSON.stringify(payload);
  if (serialized.length > 500_000) throw new Error('Soul payload is too large.');
  return serialized;
}

export function isEncryptedSoulRecord(record) {
  return Boolean(
    record && record.schemaVersion === FORMAT_VERSION && record.cipher === 'AES-GCM-256' &&
    record.kdf === 'PBKDF2-SHA256' && record.iterations === PBKDF2_ITERATIONS &&
    typeof record.salt === 'string' && typeof record.iv === 'string' && typeof record.ciphertext === 'string'
  );
}

export async function encryptSoulPayload(soulKey, payload) {
  const api = cryptoApi();
  const normalized = normalizeSoulKey(soulKey);
  const storageId = await soulStorageId(normalized);
  const salt = api.getRandomValues(new Uint8Array(16));
  const iv = api.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(normalized, salt, 'encrypt');
  const additionalData = encoder.encode(`EMPATH-SOUL-v${FORMAT_VERSION}:${storageId}`);
  const plaintext = encoder.encode(normalizePayload(payload));
  const ciphertext = await api.subtle.encrypt({ name:'AES-GCM', iv, additionalData }, key, plaintext);
  return {
    storageId,
    record:{
      schemaVersion:FORMAT_VERSION,
      cipher:'AES-GCM-256',
      kdf:'PBKDF2-SHA256',
      iterations:PBKDF2_ITERATIONS,
      salt:toBase64Url(salt),
      iv:toBase64Url(iv),
      ciphertext:toBase64Url(new Uint8Array(ciphertext))
    }
  };
}

export async function decryptSoulPayload(soulKey, record) {
  if (!isEncryptedSoulRecord(record)) throw new Error('Unsupported Soul record format.');
  const normalized = normalizeSoulKey(soulKey);
  const storageId = await soulStorageId(normalized);
  const salt = fromBase64Url(record.salt, 64);
  const iv = fromBase64Url(record.iv, 32);
  if (salt.length !== 16 || iv.length !== 12) throw new Error('Invalid encrypted Soul record.');
  const key = await deriveEncryptionKey(normalized, salt, 'decrypt');
  const additionalData = encoder.encode(`EMPATH-SOUL-v${FORMAT_VERSION}:${storageId}`);
  let plaintext;
  try {
    plaintext = await cryptoApi().subtle.decrypt({ name:'AES-GCM', iv, additionalData }, key, fromBase64Url(record.ciphertext));
  } catch {
    throw new Error('Soul record could not be decrypted.');
  }
  try {
    return JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new Error('Decrypted Soul record is invalid.');
  }
}

export { FORMAT_VERSION as SOUL_SCHEMA_VERSION, PBKDF2_ITERATIONS, normalizeSoulKey };
