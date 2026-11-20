import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRealtimeLifecycle } from '../realtime-lifecycle.mjs';

function fixture() {
  let now = 1000000, nextTimer = 0, subscriptions = 0, stopped = 0;
  let resolveJoin;
  const intervals = new Map(), timeouts = new Map(), writes = [];
  const makeTarget = () => {
    const handlers = new Map();
    return {
      addEventListener(name, fn) { const list = handlers.get(name) || []; list.push(fn); handlers.set(name, list); },
      fire(name, event = {}) { for (const fn of handlers.get(name) || []) fn(event); }
    };
  };
  function element() {
    const classes = new Set();
    return { ...makeTarget(), classList:{ add:(...names) => names.forEach(n => classes.add(n)), remove:(...names) => names.forEach(n => classes.delete(n)), contains:n => classes.has(n) },
      setAttribute() {}, focus() {}, style:{}, parentNode:{ insertBefore() {} } };
  }
  const elements = new Map(['silent-company-overlay', 'silent-company-exit', 'silent-company-count', 'silent-company-time', 'silent-company-progress', 'input'].map(id => [id, element()]));
  const document = { ...makeTarget(), hidden:false, body:element(), getElementById:id => elements.get(id), createElement:element, querySelector:() => null };
  const window = { ...makeTarget(), showToast() {} };
  const lifecycle = createRealtimeLifecycle({ isHidden:() => document.hidden });
  // Same stop/resume event contract as the application integration.
  document.addEventListener('visibilitychange', () => document.hidden ? lifecycle.stop() : lifecycle.start(() => {}));
  window.addEventListener('pagehide', () => lifecycle.stop());
  window.addEventListener('pageshow', () => lifecycle.start(() => {}));
  const context = vm.createContext({
    window, document, console, Date:class extends Date { static now() { return now; } },
    setTimeout(fn, ms) { const id = ++nextTimer; timeouts.set(id, { fn, at:now + ms }); return id; },
    clearTimeout:id => timeouts.delete(id),
    setInterval(fn) { const id = ++nextTimer; intervals.set(id, fn); return id; }, clearInterval:id => intervals.delete(id),
    db:{}, doc:(...args) => args.slice(1),
    setDoc:async (...args) => { writes.push(args); },
    onSnapshot() { subscriptions++; return () => stopped++; },
    registerAuxiliarySubscription:lifecycle.register, removeAuxiliarySubscription:lifecycle.remove,
    safeSessionStorage:{ getItem:() => null, setItem() {} }, getDriftClientId:() => 'client',
    joinSilentCompanionshipRequest:() => new Promise(resolve => { resolveJoin = resolve; }), t:zh => zh
  });
  vm.runInContext(readFileSync(new URL('../frontend/13-presence-and-companionship.js', import.meta.url), 'utf8'), context);
  lifecycle.start(() => {});
  return { window, document, elements, intervals, timeouts, writes, context,
    join() { resolveJoin({ data:{ accepted:true, bucket:3, count:1 } }); },
    advance(ms) { now += ms; for (const [id, entry] of [...timeouts]) if (entry.at <= now) { timeouts.delete(id); entry.fn(); } for (const fn of [...intervals.values()]) fn(); },
    hide() { document.hidden = true; document.fire('visibilitychange'); },
    show() { document.hidden = false; document.fire('visibilitychange'); },
    counts:() => ({ subscriptions, stopped }) };
}

test('closing while join is pending cannot restart a companionship session', async () => {
  const f = fixture();
  const pending = f.window.startSilentCompanionship();
  f.window.stopSilentCompanionship();
  f.join(); await pending;
  assert.equal(f.intervals.size, 0);
  assert.equal(f.counts().subscriptions, 0);
  assert.equal(f.elements.get('silent-company-overlay').classList.contains('show'), false);
});

test('companionship suspends in background and resumes against the original deadline', async () => {
  const f = fixture();
  const pending = f.window.startSilentCompanionship(); f.join(); await pending;
  assert.equal(f.intervals.size, 1);
  f.hide(); assert.equal(f.intervals.size, 0); assert.equal(f.counts().stopped, 1);
  f.advance(120000); f.show(); f.show();
  assert.equal(f.elements.get('silent-company-time').textContent, '03:00');
  assert.equal(f.intervals.size, 1); assert.equal(f.counts().subscriptions, 2);
  f.hide(); f.advance(180000); f.show();
  assert.equal(f.intervals.size, 0);
  assert.equal(f.elements.get('silent-company-overlay').classList.contains('show'), false);
  assert.equal(f.counts().subscriptions, 2);
});

test('a join resolving after pagehide waits for pageshow before starting resources', async () => {
  const f = fixture(); const pending = f.window.startSilentCompanionship();
  f.window.fire('pagehide'); f.join(); await pending;
  assert.equal(f.intervals.size, 0); assert.equal(f.counts().subscriptions, 0);
  f.window.fire('pageshow', { persisted:true }); f.window.fire('pageshow', { persisted:true });
  assert.equal(f.intervals.size, 1); assert.equal(f.counts().subscriptions, 1);
  f.window.stopSilentCompanionship();
  assert.equal(f.intervals.size, 0); assert.equal(f.counts().stopped, 1);
});

test('presence cancels delayed writes on hide and accepts fresh typing after restore', () => {
  const f = fixture(); vm.runInContext("setupRoomPresence('e', 'input')", f.context);
  f.elements.get('input').fire('input'); assert.equal(f.writes.length, 1);
  f.hide(); f.advance(4000);
  assert.equal(f.writes.length, 1); assert.equal(f.timeouts.size, 0);
  f.elements.get('input').fire('input'); assert.equal(f.writes.length, 1);
  f.show(); f.elements.get('input').fire('input'); assert.equal(f.writes.length, 2);
  f.advance(3000); assert.equal(f.writes.length, 3);
  assert.equal(f.writes[2][1].by, 'none');
});

test('collective silence clock stops and restores without duplicate intervals', () => {
  const f = fixture();
  f.elements.set('silence-overlay', f.elements.get('silent-company-overlay'));
  f.elements.set('silence-timer', {});
  const source = readFileSync(new URL('../frontend/14-time-and-final-initialization.js', import.meta.url), 'utf8');
  const start = source.indexOf('  const updateSilenceMoment =');
  const end = source.indexOf('  // 🌟 瞬間視覺魔法', start);
  assert(start >= 0 && end > start);
  vm.runInContext(source.slice(start, end), f.context);
  assert.equal(f.intervals.size, 1);
  f.hide(); assert.equal(f.intervals.size, 0);
  f.show(); f.show(); assert.equal(f.intervals.size, 1);
  f.window.fire('pagehide'); assert.equal(f.intervals.size, 0);
  f.window.fire('pageshow'); assert.equal(f.intervals.size, 1);
});
