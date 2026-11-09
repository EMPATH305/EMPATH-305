import test from 'node:test';
import assert from 'node:assert/strict';
import { createRealtimeLifecycle } from '../realtime-lifecycle.mjs';

test('background and repeated resume events do not duplicate feeds or counters', () => {
  let hidden = true, starts = 0, stops = 0, auxStarts = 0, auxStops = 0;
  const lifecycle = createRealtimeLifecycle({ isHidden:() => hidden });
  const subscribe = () => { starts++; lifecycle.track(() => stops++); lifecycle.track(() => stops++); };
  lifecycle.register('presence', () => { auxStarts++; return () => auxStops++; });
  assert.equal(lifecycle.start(subscribe), false);
  assert.equal(auxStarts, 0);
  hidden = false;
  assert.equal(lifecycle.start(subscribe), true);
  assert.equal(lifecycle.start(subscribe), false);
  assert.equal(starts, 1);
  assert.equal(auxStarts, 1);
  hidden = true;
  lifecycle.stop(); lifecycle.stop();
  assert.equal(stops, 2); assert.equal(auxStops, 1);
  assert.equal(lifecycle.getPrimaryCount(), 0);
  hidden = false;
  lifecycle.start(subscribe);
  assert.equal(starts, 2); assert.equal(auxStarts, 2);
});

test('replacing and removing auxiliary subscriptions releases old listeners', () => {
  const events = [];
  const lifecycle = createRealtimeLifecycle();
  lifecycle.register('warmth', () => { events.push('old'); return () => events.push('stop old'); });
  lifecycle.register('warmth', () => { events.push('new'); return () => events.push('stop new'); });
  lifecycle.remove('warmth'); lifecycle.remove('warmth');
  lifecycle.stop(); lifecycle.start(() => {});
  assert.deepEqual(events, ['old', 'stop old', 'new', 'stop new']);
});

test('one cleanup failure does not prevent other listeners from stopping', () => {
  const errors = []; let stopped = 0;
  const lifecycle = createRealtimeLifecycle({ onError:(error, key) => errors.push(key) });
  lifecycle.start(() => {
    lifecycle.track(() => { throw new Error('cleanup'); });
    lifecycle.track(() => stopped++);
  });
  lifecycle.register('presence', () => () => stopped++);
  lifecycle.stop(); lifecycle.stop();
  assert.equal(stopped, 2); assert.deepEqual(errors, ['primary']);
});

test('partial startup failure releases listeners and permits retry', () => {
  const lifecycle = createRealtimeLifecycle(); let stopped = 0;
  assert.throws(() => lifecycle.start(() => {
    lifecycle.track(() => stopped++); throw new Error('startup');
  }), /startup/);
  assert.equal(stopped, 1); assert.equal(lifecycle.getPrimaryCount(), 0);
  assert.equal(lifecycle.start(() => lifecycle.track(() => stopped++)), true);
  lifecycle.stop(); assert.equal(stopped, 2);
});

test('auxiliary startup errors can recover after the next stop and resume', () => {
  let attempts = 0, stopped = 0; const errors = [];
  const lifecycle = createRealtimeLifecycle({ onError:(error, key) => errors.push(key) });
  lifecycle.register('presence', () => {
    if (++attempts === 1) throw new Error('offline');
    return () => stopped++;
  });
  lifecycle.stop(); lifecycle.start(() => {}); lifecycle.stop();
  assert.equal(attempts, 2); assert.equal(stopped, 1);
  assert.deepEqual(errors, ['presence']);
});

test('a synchronous self-removing snapshot cannot leak its returned unsubscribe', () => {
  const lifecycle = createRealtimeLifecycle(); let stopped = 0;
  lifecycle.register('warmth', () => {
    lifecycle.remove('warmth');
    return () => stopped++;
  });
  lifecycle.stop(); lifecycle.start(() => {});
  assert.equal(stopped, 1);
});
