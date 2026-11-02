'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const {
  createCallableTelemetry,
  coarseClientFamily,
  durationBucket,
  safeErrorCode,
  safeResultFlags
} = require('../lib/callable-telemetry');

test('telemetry records only allowlisted result booleans', () => {
  assert.deepEqual(safeResultFlags({
    accepted:true,
    deduplicated:false,
    id:'private-document-id',
    text:'private message',
    totalVisitors:42
  }), {
    accepted:true,
    deduplicated:false
  });
});

test('telemetry keeps timing and browser compatibility dimensions coarse', () => {
  assert.equal(durationBucket(125), 'under-250ms');
  assert.equal(durationBucket(4_200), '3-9.9s');
  assert.equal(coarseClientFamily({
    rawRequest:{ headers:{ 'user-agent':'Mozilla/5.0 (iPhone) Instagram 300.0' } }
  }), 'ios-embedded');
  assert.equal(coarseClientFamily({
    rawRequest:{ headers:{ 'user-agent':'Mozilla/5.0 (Linux; Android 14; wv)' } }
  }), 'android-embedded');
  assert.equal(coarseClientFamily({
    rawRequest:{ headers:{ 'user-agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X)' } }
  }), 'desktop-browser');
});

test('telemetry normalizes callable errors without recording messages', () => {
  assert.equal(safeErrorCode({ code:'functions/resource-exhausted', message:'private text' }), 'resource-exhausted');
  assert.equal(safeErrorCode({ code:'unexpected-code', message:'private text' }), 'internal');
});

test('successful callable telemetry is structured and privacy safe', async () => {
  const events = [];
  const logger = {
    info(message, metadata) { events.push({ level:'info', message, metadata }); },
    warn(message, metadata) { events.push({ level:'warn', message, metadata }); }
  };
  const times = [100, 125];
  const observe = createCallableTelemetry(logger, () => times.shift());
  const result = await observe('submitRoomContent', false, async () => ({
    accepted:true,
    deduplicated:true,
    id:'must-not-be-logged',
    text:'must-not-be-logged'
  }))({
    app:{ token:{} },
    rawRequest:{ headers:{ 'user-agent':'Mozilla/5.0 (iPhone)' } }
  });

  assert.equal(result.id, 'must-not-be-logged');
  assert.equal(events.length, 1);
  assert.deepEqual(events[0].metadata, {
    telemetryEvent:'empath.callable',
    telemetryVersion:1,
    functionName:'submitRoomContent',
    appCheckVerified:true,
    appCheckEnforced:false,
    authenticated:false,
    clientFamily:'ios-browser',
    outcome:'success',
    durationBucket:'under-250ms',
    accepted:true,
    deduplicated:true
  });
  assert(!JSON.stringify(events[0]).includes('must-not-be-logged'));
});

test('rejected callable telemetry preserves the error but not its message', async () => {
  const events = [];
  const logger = {
    info(message, metadata) { events.push({ level:'info', message, metadata }); },
    warn(message, metadata) { events.push({ level:'warn', message, metadata }); }
  };
  const times = [200, 240];
  const observe = createCallableTelemetry(logger, () => times.shift());
  const original = Object.assign(new Error('sensitive failure detail'), { code:'invalid-argument' });

  await assert.rejects(
    observe('sendDriftLetter', false, async () => { throw original; })({}),
    error => error === original
  );
  assert.equal(events[0].metadata.errorCode, 'invalid-argument');
  assert.equal(events[0].metadata.outcome, 'rejected');
  assert(!JSON.stringify(events[0]).includes('sensitive failure detail'));
});

test('public App Check rollout is configured per callable and remains monitoring-only', () => {
  const functionSource = readFileSync(new URL('../index.js', `file://${__dirname}/`), 'utf8');
  const configuredFunctions = [
    'submitContentReport',
    'submitRoomContent',
    'deleteRoomContent',
    'reactToRoomContent',
    'joinSilentCompanionship',
    'recordSiteVisit',
    'initializePublicRetention',
    'initializeModerationRetention',
    'retireLegacySoulJourney',
    'deleteSoulJourney',
    'sendDriftLetter',
    'receiveDriftLetter'
  ];

  for (const functionName of configuredFunctions) {
    assert(functionSource.includes(`${functionName}:false`));
    assert(functionSource.includes(`observedOnCall('${functionName}'`));
    assert(functionSource.includes(`PUBLIC_APP_CHECK_ENFORCEMENT.${functionName}`));
  }
  assert(!functionSource.includes('PUBLIC_REPORT_APP_CHECK_ENFORCED'));
});
