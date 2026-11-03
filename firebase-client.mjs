import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app-check.js';
import {
  getFunctions,
  httpsCallable
} from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js';

const firebaseConfig = Object.freeze({
  apiKey:'AIzaSyANaBq5vt8G5L2GJjzAAfVmHYFeKA9bF90',
  authDomain:'empath-62582.firebaseapp.com',
  projectId:'empath-62582',
  storageBucket:'empath-62582.firebasestorage.app',
  messagingSenderId:'945974527649',
  appId:'1:945974527649:web:552e236eff7809dfea52e0',
  measurementId:'G-9Z9X6E7WBZ'
});

export const app = initializeApp(firebaseConfig);

// App Check remains in monitored rollout mode for public callables. The key is
// a public site identifier; security comes from its domain restrictions and
// server-side token verification.
export const APP_CHECK_ENTERPRISE_SITE_KEY = '6LfIqgEuAAAAADuOmZVHbEizh5hw3GAKMcziAcXy';
if (APP_CHECK_ENTERPRISE_SITE_KEY) {
  initializeAppCheck(app, {
    provider:new ReCaptchaEnterpriseProvider(APP_CHECK_ENTERPRISE_SITE_KEY),
    isTokenAutoRefreshEnabled:true
  });
}

// Automatic long-polling detection avoids WebChannel failures on some iOS,
// campus-network, proxy, and embedded-browser connections. Persistent cache
// allows a previously visited room to render during a short outage.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling:true,
  useFetchStreams:false,
  localCache:persistentLocalCache({ tabManager:persistentMultipleTabManager() })
});

const functions = getFunctions(app, 'asia-east1');

export const callables = Object.freeze({
  submitContentReport:httpsCallable(functions, 'submitContentReport'),
  submitRoomContent:httpsCallable(functions, 'submitRoomContent'),
  deleteRoomContent:httpsCallable(functions, 'deleteRoomContent'),
  reactToRoomContent:httpsCallable(functions, 'reactToRoomContent'),
  sendDriftLetter:httpsCallable(functions, 'sendDriftLetter'),
  receiveDriftLetter:httpsCallable(functions, 'receiveDriftLetter'),
  joinSilentCompanionship:httpsCallable(functions, 'joinSilentCompanionship'),
  recordSiteVisit:httpsCallable(functions, 'recordSiteVisit'),
  retireLegacySoulJourney:httpsCallable(functions, 'retireLegacySoulJourney'),
  deleteSoulJourney:httpsCallable(functions, 'deleteSoulJourney')
});
