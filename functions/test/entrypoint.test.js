'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('Firebase entrypoint loads with real SDKs and exposes every callable', () => {
  const result = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const handlers = require('./index.js');
    const expected = [
      'claimAdminRole', 'submitContentReport', 'submitRoomContent',
      'deleteRoomContent', 'reactToRoomContent', 'joinSilentCompanionship',
      'recordSiteVisit', 'initializePublicRetention', 'initializeModerationRetention',
      'retireLegacySoulJourney', 'deleteSoulJourney', 'sendDriftLetter',
      'receiveDriftLetter', 'listReports', 'moderateReport'
    ];
    assert.deepEqual(Object.keys(handlers).sort(), expected.sort());
    for (const name of expected) {
      assert.equal(typeof handlers[name], 'function', name);
      assert(handlers[name].__endpoint?.callableTrigger, name);
    }
  `], {
    cwd:path.resolve(__dirname, '..'),
    env:{ ...process.env, GCLOUD_PROJECT:'demo-empath-startup' },
    encoding:'utf8', timeout:15000
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
