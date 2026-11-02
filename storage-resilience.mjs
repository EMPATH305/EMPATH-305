const DEFAULT_PENDING_KEY = 'empath_pending_room_submissions_v1';
const DEFAULT_PENDING_TTL_MS = 48 * 60 * 60 * 1000;

export function getBrowserStorage(name) {
  try {
    return globalThis[name] || null;
  } catch (error) {
    return null;
  }
}

export function createSafeStorage(nativeStorage) {
  const memory = new Map();
  const unpersisted = new Set();

  return {
    getItem(key) {
      const normalizedKey = String(key);
      try {
        const value = nativeStorage?.getItem(normalizedKey);
        if (value !== null && value !== undefined) {
          const normalizedValue = String(value);
          memory.set(normalizedKey, normalizedValue);
          unpersisted.delete(normalizedKey);
          return normalizedValue;
        }
        if (unpersisted.has(normalizedKey)) return memory.get(normalizedKey) ?? null;
        memory.delete(normalizedKey);
        return null;
      } catch (error) {
        return memory.get(normalizedKey) ?? null;
      }
    },

    setItem(key, value) {
      const normalizedKey = String(key);
      const normalizedValue = String(value);
      memory.set(normalizedKey, normalizedValue);
      try {
        if (!nativeStorage) throw new Error('Storage unavailable');
        nativeStorage.setItem(normalizedKey, normalizedValue);
        unpersisted.delete(normalizedKey);
        return true;
      } catch (error) {
        unpersisted.add(normalizedKey);
        return false;
      }
    },

    removeItem(key) {
      const normalizedKey = String(key);
      memory.delete(normalizedKey);
      unpersisted.delete(normalizedKey);
      try {
        if (!nativeStorage) throw new Error('Storage unavailable');
        nativeStorage.removeItem(normalizedKey);
        return true;
      } catch (error) {
        return false;
      }
    }
  };
}

export function generateSubmissionRequestId(cryptoApi = globalThis.crypto) {
  const bytes = new Uint8Array(16);
  cryptoApi?.getRandomValues?.(bytes);
  if (!bytes.some(Boolean)) {
    bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256); });
  }
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function canonicalSubmission(room, payload = {}) {
  return JSON.stringify({
    room:String(room || '').toLowerCase(),
    text:typeof payload.text === 'string' ? payload.text : '',
    image:typeof payload.image === 'string' ? payload.image : '',
    lifespan:Number.isInteger(payload.lifespan) ? payload.lifespan : 0,
    weightKind:typeof payload.weightKind === 'string' ? payload.weightKind : ''
  });
}

function fallbackFingerprint(value) {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193) >>> 0;
    second = Math.imul(second ^ (code + index), 0x85ebca6b) >>> 0;
  }
  return `${first.toString(16).padStart(8, '0')}${second.toString(16).padStart(8, '0')}:${value.length}`;
}

export async function submissionFingerprint(room, payload, cryptoApi = globalThis.crypto) {
  const canonical = canonicalSubmission(room, payload);
  try {
    const encoded = new TextEncoder().encode(canonical);
    const digest = await cryptoApi.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    return fallbackFingerprint(canonical);
  }
}

function readPending(storage, key, now, ttlMs) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '{}');
    const active = {};
    Object.entries(parsed && typeof parsed === 'object' ? parsed : {}).forEach(([room, records]) => {
      if (!/^[empat]$/.test(room)) return;
      const valid = (Array.isArray(records) ? records : [records]).filter(record =>
        /^[a-f0-9]{32}$/.test(String(record?.requestId || ''))
        && typeof record?.fingerprint === 'string'
        && Number.isFinite(Number(record?.createdAt))
        && now - Number(record.createdAt) >= 0
        && now - Number(record.createdAt) < ttlMs
      ).slice(-5);
      if (valid.length) active[room] = valid;
    });
    return active;
  } catch (error) {
    return {};
  }
}

export async function getOrCreateSubmissionRequest(storage, room, payload, options = {}) {
  const now = Number(options.now ?? Date.now());
  const ttlMs = Number(options.ttlMs) || DEFAULT_PENDING_TTL_MS;
  const key = options.key || DEFAULT_PENDING_KEY;
  const fingerprint = await submissionFingerprint(room, payload, options.cryptoApi);
  const pending = readPending(storage, key, now, ttlMs);
  const existing = pending[room]?.find(record => record.fingerprint === fingerprint);
  if (existing) {
    return { requestId:existing.requestId, fingerprint, reused:true };
  }
  const requestId = generateSubmissionRequestId(options.cryptoApi);
  pending[room] = [...(pending[room] || []), { requestId, fingerprint, createdAt:now }].slice(-5);
  storage.setItem(key, JSON.stringify(pending));
  return { requestId, fingerprint, reused:false };
}

export function completeSubmissionRequest(storage, room, requestId, options = {}) {
  const now = Number(options.now ?? Date.now());
  const ttlMs = Number(options.ttlMs) || DEFAULT_PENDING_TTL_MS;
  const key = options.key || DEFAULT_PENDING_KEY;
  const pending = readPending(storage, key, now, ttlMs);
  const records = pending[room] || [];
  if (!records.some(record => record.requestId === requestId)) return false;
  pending[room] = records.filter(record => record.requestId !== requestId);
  if (!pending[room].length) delete pending[room];
  if (Object.keys(pending).length) storage.setItem(key, JSON.stringify(pending));
  else storage.removeItem(key);
  return true;
}
