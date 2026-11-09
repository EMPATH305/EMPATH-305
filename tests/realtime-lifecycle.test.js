'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const source = readFileSync(new URL('../firebase-app.js', `file://${__dirname}/`), 'utf8');

test('auxiliary Firestore listeners share the background lifecycle', () => {
  assert(source.includes('import { createRealtimeLifecycle } from "./realtime-lifecycle.mjs"'));
  assert(source.includes('isHidden:() => document.hidden'));
  assert(source.includes('const registerAuxiliarySubscription = realtimeLifecycle.register'));
  assert(source.includes('const removeAuxiliarySubscription = realtimeLifecycle.remove'));
  assert(source.includes("window.addEventListener('pagehide', unsubscribeAll)"));
  assert(source.includes("window.addEventListener('pageshow', event =>"));
  assert(source.includes('if (event.persisted) subscribeRealtimeData()'));
  const unsubscribeAll = source.split('function unsubscribeAll()')[1].split('function subscribeSiteStats()')[0];
  assert(unsubscribeAll.includes('realtimeLifecycle.stop()'));
  const subscribeRealtime = source.split('function subscribeRealtimeData()')[1].split("document.addEventListener('visibilitychange'")[0];
  assert(subscribeRealtime.includes('realtimeLifecycle.start(() =>'));
});

test('presence and Room T return listeners cannot accumulate duplicates', () => {
  assert(source.includes('registerAuxiliarySubscription(`presence:${roomKey}`'));
  assert(source.includes("registerAuxiliarySubscription(subscriptionKey, () => onSnapshot("));
  assert(source.includes('removeAuxiliarySubscription(subscriptionKey)'));
  assert(source.includes("const subscriptionKey = 'warmth:return'"));
});

test('a new Room T submission immediately follows its latest echo lifecycle', () => {
  const submitT = source.split('window.submitT = async function()')[1].split('window.createEchoRipple')[0];
  assert(submitT.includes("safeLocalStorage.setItem('empath_my_warmth_id', contentId)"));
  assert(submitT.includes('window.checkRoomTWarmth()'));
});
