import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

let now = 1_800_000_000_000;
const storage = new Map();
const localStorage = {
  getItem:key => storage.has(key) ? storage.get(key) : null,
  setItem:(key, value) => storage.set(key, String(value))
};
class TestDate extends Date {
  static now() { return now; }
}
const window = {};
const context = vm.createContext({
  window,
  localStorage,
  Date:TestDate,
  document:{ addEventListener() {}, getElementById() { return null; } },
  Object,
  Set,
  Array,
  Number,
  String,
  JSON,
  Math
});
vm.runInContext(readFileSync('safety-guard.js', 'utf8'), context);

const safety = window.EmpathSafety;
assert.ok(safety, 'Safety API must be exposed');
assert.equal(safety.allowAction('submit-e', { cooldownMs:15_000, dailyLimit:2 }).allowed, true);
assert.equal(safety.allowAction('submit-e', { cooldownMs:15_000, dailyLimit:2 }).reason, 'cooldown');
now += 15_001;
assert.equal(safety.allowAction('submit-e', { cooldownMs:15_000, dailyLimit:2 }).allowed, true);
now += 15_001;
assert.equal(safety.allowAction('submit-e', { cooldownMs:15_000, dailyLimit:2 }).reason, 'daily-limit');

assert.equal(safety.isHidden('emotions', 'abc'), false);
safety.hideContent('emotions', 'abc');
assert.equal(safety.isHidden('emotions', 'abc'), true);
assert.equal(safety.isHidden('stars', 'abc'), false, 'Collection must be part of the local content key');

assert.equal(safety.isReported('warmth', 'xyz'), false);
safety.markReported('warmth', 'xyz');
assert.equal(safety.isReported('warmth', 'xyz'), true);

assert.equal(Object.isFrozen(safety), true, 'Safety API must not be mutable');
console.log('Safety guard checks passed.');
