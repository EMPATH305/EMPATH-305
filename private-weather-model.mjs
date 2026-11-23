export const WEATHER_KEY = 'empath_private_weather_v1';
export const WEATHER_ROOMS = Object.freeze(['e', 'm', 'p', 'a', 't', 'h']);

export function weatherDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startDay(now, days) {
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days + 1);
  return weatherDay(date);
}

function validDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T12:00:00`);
  return Number.isFinite(date.getTime()) && weatherDay(date) === day;
}

function normalize(value, now) {
  const state = { version:1, enabled:false, entries:[] };
  if (value?.version !== 1) return state;
  state.enabled = value.enabled === true;
  const seen = new Set();
  const first = startDay(now, 30), last = weatherDay(now);
  for (const entry of Array.isArray(value.entries) ? value.entries : []) {
    if (!validDay(entry?.day) || entry.day < first || entry.day > last || !WEATHER_ROOMS.includes(entry.room)) continue;
    const key = `${entry.day}:${entry.room}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // Explicit allowlist: text, IDs, timestamps and extra fields never survive.
    state.entries.push({ day:entry.day, room:entry.room });
  }
  state.entries.sort((a,b) => a.day.localeCompare(b.day) || a.room.localeCompare(b.room));
  return state;
}

export function summarizeWeather(state, days = 7, now = new Date()) {
  const period = days === 30 ? 30 : 7;
  const entries = normalize(state, now).entries.filter(entry => entry.day >= startDay(now, period));
  return {
    days:period,
    recordedDays:new Set(entries.map(entry => entry.day)).size,
    rooms:WEATHER_ROOMS.map(room => ({ room, days:entries.filter(entry => entry.room === room).length }))
  };
}

// Storage is injected: this module has no network or dependency on cloud history.
export function createPrivateWeather({ storage, now = () => new Date() }) {
  let volatile = null;
  let deletionFailed = false;
  function write(state) {
    const saved = storage.setItem(WEATHER_KEY, JSON.stringify(state));
    volatile = saved ? null : state;
    return saved;
  }
  function read() {
    if (volatile) return normalize(volatile, now());
    const raw = storage.getItem(WEATHER_KEY);
    let value;
    try { value = JSON.parse(raw || 'null'); } catch { value = null; }
    const state = normalize(value, now());
    // Prune and sanitize an existing valid record, never create one on first visit.
    if (value?.version === 1 && raw !== JSON.stringify(state)) write(state);
    return state;
  }
  function snapshot() {
    return { ...read(), temporary:volatile !== null, deletionFailed };
  }
  function setEnabled(enabled) {
    const state = read();
    state.enabled = enabled === true;
    write(state);
    return snapshot();
  }
  function record(room) {
    const state = read();
    if (!state.enabled || !WEATHER_ROOMS.includes(room)) return false;
    const day = weatherDay(now());
    if (state.entries.some(entry => entry.day === day && entry.room === room)) return false;
    state.entries.push({ day, room });
    write(normalize(state, now()));
    return true;
  }
  function clear() {
    const empty = { version:1, enabled:false, entries:[] };
    // A disabled tombstone is a fallback if removing the key is blocked.
    const removed = storage.removeItem(WEATHER_KEY);
    const saved = removed || storage.setItem(WEATHER_KEY, JSON.stringify(empty));
    deletionFailed = !saved;
    volatile = saved ? null : empty;
    return saved;
  }
  function refresh() {
    volatile = null;
    return snapshot();
  }
  return Object.freeze({ snapshot, setEnabled, record, clear, refresh });
}
