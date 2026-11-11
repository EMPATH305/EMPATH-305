import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../firebase-app.js', import.meta.url), 'utf8');
const clientSource = readFileSync(new URL('../firebase-client.mjs', import.meta.url), 'utf8');
const serviceWorkerSource = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

test('Firebase initialization has one explicit client boundary', () => {
  assert(clientSource.includes("initializeApp(firebaseConfig)"));
  assert(clientSource.includes("getFunctions(app, 'asia-east1')"));
  assert(clientSource.includes('experimentalAutoDetectLongPolling:true'));
  assert(clientSource.includes('persistentMultipleTabManager()'));
  assert(appSource.includes('import { app, callables, db, runtimeProfile } from "./firebase-client.mjs"'));
  assert(!appSource.includes('initializeApp('));
  assert(!appSource.includes('initializeAppCheck('));
  assert(!appSource.includes('getFunctions('));
});

test('the client boundary exposes every callable contract used by the experience', () => {
  const callableNames = [
    'submitContentReport',
    'submitRoomContent',
    'deleteRoomContent',
    'reactToRoomContent',
    'sendDriftLetter',
    'receiveDriftLetter',
    'joinSilentCompanionship',
    'recordSiteVisit',
    'retireLegacySoulJourney',
    'deleteSoulJourney'
  ];
  for (const functionName of callableNames) {
    assert(clientSource.includes(`httpsCallable(functions, '${functionName}')`));
    assert(appSource.includes(functionName));
  }
});

test('the modular client is available offline and cache-busted on every page', () => {
  assert(serviceWorkerSource.includes("'./firebase-client.mjs'"));
  assert(serviceWorkerSource.includes("'./browser-runtime.mjs'"));
  assert(serviceWorkerSource.includes("'./submission-service.mjs'"));
  assert(serviceWorkerSource.includes("'./realtime-lifecycle.mjs'"));
  assert(serviceWorkerSource.includes("'./soul-model.mjs'"));
  assert(serviceWorkerSource.includes("'./soul-sync-controller.mjs'"));
  assert(serviceWorkerSource.includes("'./soul-backup-service.mjs'"));
  assert(serviceWorkerSource.includes("'./room-t-feed.mjs'"));
  assert(serviceWorkerSource.includes('empath-cache-v23.10.0'));
  for (const pageName of [
    'index.html',
    'room-e.html',
    'room-m.html',
    'room-p.html',
    'room-a.html',
    'room-t.html',
    'room-h.html'
  ]) {
    const pageSource = readFileSync(new URL(`../${pageName}`, import.meta.url), 'utf8');
    assert(pageSource.includes('firebase-app.js?v=23.10.0'));
  }
});
