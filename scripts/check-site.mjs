import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = ['index.html', 'room-e.html', 'room-m.html', 'room-p.html', 'room-a.html', 'room-t.html', 'room-h.html'];
const requiredAssets = ['styles.css?v=21.2.0', 'safety-guard.js?v=20.5', 'firebase-app.js?v=21.4.0', 'collective-calendar.js?v=21.1.0', 'interactions.js?v=20.5', 'room-router.js?v=20.5'];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');

  for (const asset of requiredAssets) {
    assert(html.includes(asset), `${page}: missing versioned asset ${asset}`);
  }

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], [], `${page}: duplicate IDs found`);

  for (const match of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    assert(/\brel=["'][^"']*noopener[^"']*["']/i.test(match[0]), `${page}: target=_blank link missing noopener`);
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  assert.equal(h1Count, 1, `${page}: expected exactly one h1`);
  if (page !== 'index.html') {
    assert(/<h1\b[^>]*class=["'][^"']*room-title/.test(html), `${page}: room title must be the h1`);
  }
}

const appSource = readFileSync('firebase-app.js', 'utf8');
const styles = readFileSync('styles.css', 'utf8');
const rules = readFileSync('firestore.rules', 'utf8');
const roomE = readFileSync('room-e.html', 'utf8');
const roomA = readFileSync('room-a.html', 'utf8');
const collectiveCalendar = readFileSync('collective-calendar.js', 'utf8');
assert(collectiveCalendar.includes("en-u-ca-chinese"), 'Collective calendar must recognize lunar observances locally');
assert(collectiveCalendar.includes('empath_collective_grief_seen_'), 'Collective calendar must avoid repeating within a session');
assert(collectiveCalendar.includes('copy.textContent = messageFor(moment)'), 'Collective calendar copy must use safe DOM text rendering');
assert(!collectiveCalendar.includes('.innerHTML'), 'Collective calendar must not render HTML strings');
assert(/#room-a\s+\.a-collective-count\s*\{[^}]*grid-column:\s*7\/13!important;[^}]*grid-row:\s*6!important;/s.test(styles), 'Room A collective count must occupy the right content column');
assert(/#room-a\s+\.a-release-witness\s*\{[^}]*grid-column:\s*7\/13!important;[^}]*grid-row:\s*7!important;/s.test(styles), 'Room A witness must remain below the anonymous aggregate');
assert(/#room-a\s+#a-feed-wrapper\s*\{[^}]*grid-column:\s*1\/13!important;[^}]*grid-row:\s*9!important;/s.test(styles), 'Room A feed must remain below the witness and safety note');
assert(/where\(["']expireAt["'],\s*["']>["'],\s*roomAQueryCutoff\(\)\)/.test(appSource), 'Room A must hide expired records at query time');
assert(appSource.includes('Date.now() + 10000'), 'Room A query cutoff must stay ahead of Firestore request.time');
assert(appSource.includes('empath_analytics_consent'), 'Analytics must be consent gated');
assert(appSource.includes('empath_crisis_region'), 'Crisis support must use an explicit region preference');
assert(!appSource.includes('randomMsg.slice'), 'Room A must never replay expired message fragments');
assert(appSource.includes("doc(db, 'metadata', 'room_a_stats')"), 'Room A must use anonymous aggregate counts');
assert(appSource.includes('lastRoomAWitness'), 'Room A must render a post-release anonymous witness');
assert(appSource.includes('sameKindBefore'), 'Room A witness must distinguish broad user-selected categories');
assert(roomA.includes('id="a-release-witness"'), 'Room A must include a dedicated post-release witness');
assert(roomA.includes('name="a-weight-kind"'), 'Room A must offer an explicit broad-category choice');
assert(roomA.includes('aria-describedby="a-weight-privacy"'), 'Room A category choice must explain its privacy boundary');
assert(appSource.includes('startSilentCompanionship'), 'Room H must expose silent companionship mode');
assert(appSource.includes('initializeAppCheck'), 'Firebase App Check must be wired into the client');
assert(/APP_CHECK_ENTERPRISE_SITE_KEY\s*=\s*['"]6L[A-Za-z0-9_-]+['"]/.test(appSource), 'Production App Check site key must be configured');
assert(appSource.includes("httpsCallable(functions, 'submitContentReport')"), 'Anonymous reports must use the rate-limited backend');
assert(!appSource.includes("addDoc(collection(db, 'content_reports')"), 'Clients must not write reports directly');
assert(appSource.includes("httpsCallable(functions, 'submitRoomContent')"), 'Room submissions must use the rate-limited backend');
assert(appSource.includes("httpsCallable(functions, 'reactToRoomContent')"), 'Room reactions must use the rate-limited backend');
assert(appSource.includes("httpsCallable(functions, 'joinSilentCompanionship')"), 'Silent companionship must use the rate-limited backend');
assert(appSource.includes("httpsCallable(functions, 'recordSiteVisit')"), 'Site visits must use the rate-limited backend');
assert(!appSource.includes('updateDoc('), 'Clients must not update room content directly');
assert(!appSource.includes('addDoc('), 'Clients must not create shared records directly');
assert(!appSource.includes('runTransaction('), 'Clients must not transact shared counters directly');
assert(!appSource.includes('increment('), 'Clients must not increment shared counters directly');
assert(appSource.includes("httpsCallable(functions, 'sendDriftLetter')"), 'Room E must send drift letters through the private backend');
assert(appSource.includes("httpsCallable(functions, 'receiveDriftLetter')"), 'Room E must receive drift letters through the private backend');
assert(appSource.includes("createContentActions('drift_letters'"), 'Received drift letters must support hiding and anonymous reporting');
assert(appSource.includes("containsCrisisSignal(text)"), 'Crisis content must not be sent randomly to a stranger');
assert(roomE.includes('id="e-delivery-drift"'), 'Room E must offer private one-recipient delivery');
assert(roomE.includes('id="e-drift-receive-btn"'), 'Room E must offer active letter pickup');
assert(roomE.includes('id="e-drift-letter-text"'), 'Room E must render received text without placing it in the public feed');
assert(styles.includes('.e-drift-dock'), 'Letter drift must have a responsive, branded presentation');
assert(/\.collective-grief-close\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;/s.test(styles), 'Collective calendar close control must meet the 44px touch target');
for (const collectionName of ['emotions', 'stars', 'shards', 'sand', 'warmth']) {
  assert(!appSource.includes(`addDoc(collection(db, "${collectionName}")`), `Clients must not create ${collectionName} directly`);
  const ruleBlock = rules.match(new RegExp(`match /${collectionName}/\\{id\\} \\{([\\s\\S]*?)\\n    \\}`));
  assert(ruleBlock?.[1].includes('allow create: if false;'), `${collectionName} creates must be server-only`);
}
for (const collectionName of ['stars', 'shards', 'warmth']) {
  const ruleBlock = rules.match(new RegExp(`match /${collectionName}/\\{id\\} \\{([\\s\\S]*?)\\n    \\}`));
  assert(ruleBlock?.[1].includes('allow update, delete: if false;'), `${collectionName} updates must be server-only`);
}
assert(appSource.includes("createRoomContent('a', { text, lifespan, weightKind }, true)"), 'Room A content and anonymous category count must share the server transaction');
assert(appSource.includes("localStorage.setItem('empath_my_warmth_id', contentId)"), 'Room T must retain the server-generated ID');
assert(appSource.includes('new Uint8Array(16)'), 'New Soul Keys must use 128 bits of entropy');
assert(appSource.includes("allowAction('soul-key-load'"), 'Soul Key lookups must be locally throttled');
assert(appSource.includes('function subscribeRealtimeData()'), 'Realtime feeds and counters must share a restartable lifecycle');
assert(appSource.includes('subscribeRoomAReleaseStats();'), 'Room A aggregate must resume after backgrounding');
assert(appSource.includes('subscribeSiteStats();'), 'Visitor totals must resume after backgrounding');
assert(/visibilitychange[\s\S]*subscribeRealtimeData\(\)/.test(appSource), 'Returning from a background tab must restore every realtime counter');

assert(rules.includes('allow get: if resource.data.expireAt is timestamp'), 'Rules must deny direct reads of expired Room A records');
assert(rules.includes('request.query.limit <= 30'), 'Room A collection reads must be bounded');
assert(rules.includes('allow read, write: if false'), 'Rules must deny undeclared collections by default');
assert(rules.includes('match /metadata/room_a_stats'), 'Rules must protect the Room A aggregate counter');
assert(rules.includes('match /metadata/silent_presence'), 'Rules must protect silent companionship counts');
for (const protectedPath of ['constellations/{id}', 'metadata/site_stats', 'metadata/silent_presence']) {
  const ruleBlock = rules.match(new RegExp(`match /${protectedPath.replace(/[{}]/g, '\\$&')} \\{([\\s\\S]*?)\\n    \\}`));
  assert(ruleBlock?.[1].includes('if false;'), `${protectedPath} writes must be server-only`);
}
assert(rules.includes('match /content_reports/{reportId}'), 'Rules must validate anonymous content reports');
assert(rules.includes('match /rate_limits/{bucketId}'), 'Rate-limit documents must be private');
assert(rules.includes('match /moderation_audit/{entryId}'), 'Moderation audit records must be private');
assert(rules.includes('match /drift_letters/{id}'), 'Drift letters must remain private to callable functions');
assert(rules.includes('EMP-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}'), 'Rules must accept v20.3 Soul Keys');

const indexes = JSON.parse(readFileSync('firestore.indexes.json', 'utf8'));
const ttlField = indexes.fieldOverrides?.find((field) => field.collectionGroup === 'sand' && field.fieldPath === 'expireAt');
assert.equal(ttlField?.ttl, true, 'Room A expireAt must be configured as a TTL field');
const rateLimitTtl = indexes.fieldOverrides?.find((field) => field.collectionGroup === 'rate_limits' && field.fieldPath === 'expiresAt');
assert.equal(rateLimitTtl?.ttl, true, 'Rate-limit buckets must expire automatically');
const driftIndex = indexes.indexes?.find(index => index.collectionGroup === 'drift_letters');
assert(driftIndex, 'Waiting drift letters must have a delivery index');
const driftTtl = indexes.fieldOverrides?.find(field => field.collectionGroup === 'drift_letters' && field.fieldPath === 'expiresAt');
assert.equal(driftTtl?.ttl, true, 'Delivered and abandoned drift letters must expire automatically');
const constellationTtl = indexes.fieldOverrides?.find(field => field.collectionGroup === 'constellations' && field.fieldPath === 'expiresAt');
assert.equal(constellationTtl?.ttl, true, 'Constellation lines must expire automatically');

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
for (const icon of manifest.icons) {
  const png = readFileSync(icon.src.replace(/^\.\//, ''));
  assert.equal(png.toString('ascii', 1, 4), 'PNG', `${icon.src}: not a PNG file`);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(`${width}x${height}`, icon.sizes, `${icon.src}: declared and actual dimensions differ`);
}

const serviceWorker = readFileSync('sw.js', 'utf8');
assert(serviceWorker.includes('empath-cache-v21.4.0'), 'Service worker cache must be bumped for v21.4.0');
assert(serviceWorker.includes("'./safety-guard.js'"), 'Service worker must precache the safety layer');
assert(serviceWorker.includes("'./collective-calendar.js'"), 'Service worker must precache the collective calendar');
for (const icon of manifest.icons) {
  assert(serviceWorker.includes(icon.src), `Service worker must precache ${icon.src}`);
}

const safetySource = readFileSync('safety-guard.js', 'utf8');
assert(safetySource.includes("aria-describedby', 'content-report-description"), 'Report dialog must expose its description');
assert(safetySource.includes("event.key === 'Escape'"), 'Report dialog must support Escape to close');
assert(safetySource.includes("event.key !== 'Tab'"), 'Report dialog must trap keyboard focus');
assert(safetySource.includes('reportReturnFocus.focus'), 'Report dialog must restore focus after closing');
assert(safetySource.includes("empath:language-changed"), 'Safety controls must react to language changes');

const adminPage = readFileSync('admin.html', 'utf8');
const adminSource = readFileSync('admin-app.js', 'utf8');
assert(adminPage.includes('noindex,nofollow,noarchive'), 'Admin route must not be indexed');
assert(adminPage.includes('admin-app.js?v=20.7.0'), 'Admin route must load the current controller');
assert(adminPage.includes('id="load-more-reports"'), 'Admin route must support paginated review');
assert(adminPage.includes('id="app-check-health"'), 'Admin route must expose App Check readiness');
assert(adminSource.includes("httpsCallable(functions, 'claimAdminRole')"), 'Admin access must be granted by the backend');
assert(adminSource.includes("httpsCallable(functions, 'moderateReport')"), 'Moderation actions must use the backend');
assert(adminSource.includes('signInWithRedirect'), 'Admin login must fall back to redirect on popup-restricted browsers');
assert(adminSource.includes('App Check 狀態未確認'), 'Admin route must distinguish an unknown App Check state from a failed token');
assert(!adminSource.includes('.innerHTML'), 'Admin content must be rendered without innerHTML');
assert(!adminSource.includes('@gmail.com'), 'Admin email must never be embedded in the client');

const firebaseSettings = JSON.parse(readFileSync('firebase.json', 'utf8'));
assert.equal(firebaseSettings.functions?.runtime, 'nodejs22', 'Functions must use the supported Node.js 22 runtime');
const functionsSource = readFileSync('functions/index.js', 'utf8');
assert(functionsSource.includes("defineSecret('ADMIN_EMAIL')"), 'Admin identity must be stored in Secret Manager');
assert(functionsSource.includes("defineSecret('RATE_LIMIT_SALT')"), 'Rate-limit salt must be stored in Secret Manager');
assert(functionsSource.includes('REPORT_LIMIT_PER_HOUR = 8'), 'Server-side report limit must remain bounded');
assert(functionsSource.includes('CONTENT_LIMIT_PER_HOUR = 12'), 'Server-side room posting limit must remain bounded');
assert(functionsSource.includes('CONTENT_LIMIT_PER_TEN_MINUTES = 6'), 'Room posting must have burst protection without blocking a five-room journey');
assert(functionsSource.includes('REACTION_LIMIT_PER_HOUR = 40'), 'Room reactions must have a bounded hourly server limit');
assert(functionsSource.includes('REACTION_RECEIPT_TTL_MS = 48 * 60 * 60 * 1000'), 'Duplicate reaction receipts must expire after 48 hours');
assert(functionsSource.includes('CONSTELLATION_TTL_MS = 24 * 60 * 60 * 1000'), 'Constellations must expire after 24 hours');
assert(functionsSource.includes('SILENT_PARTICIPANTS_PER_SOURCE_BUCKET = 5'), 'Silent companionship must bound joins per source bucket');
assert(functionsSource.includes('exports.submitRoomContent = onCall'), 'Public room submissions must have a callable backend');
assert(functionsSource.includes('exports.reactToRoomContent = onCall'), 'Public room reactions must have a callable backend');
assert(functionsSource.includes('exports.joinSilentCompanionship = onCall'), 'Silent companionship joins must have a callable backend');
assert(functionsSource.includes('exports.recordSiteVisit = onCall'), 'Anonymous site visits must have a callable backend');
assert(functionsSource.includes("throw new HttpsError('already-exists', 'This reaction was already counted.')"), 'Duplicate reactions must be rejected atomically');
assert(functionsSource.includes("doc(`reaction_${input.kind}_${targetHash}_${participantHash}`)"), 'Reaction receipts must avoid storing a raw participant address or target ID');
assert(functionsSource.includes('exports.sendDriftLetter = onCall'), 'Room E must have a private drift-letter sender');
assert(functionsSource.includes('exports.receiveDriftLetter = onCall'), 'Room E must have a one-recipient drift-letter receiver');
assert(functionsSource.includes("where('status', '==', 'waiting')"), 'Only waiting drift letters may be delivered');
assert(functionsSource.includes("status:'delivered'"), 'A received drift letter must be atomically consumed');
assert(functionsSource.includes('expireAt:Timestamp.fromMillis'), 'Room A server writes must include a Firestore TTL timestamp');
assert(functionsSource.includes('kindCounts[input.weightKind] += 1'), 'Room A must update the selected anonymous category atomically');
assert(functionsSource.includes('sameKind:kindCounts[input.weightKind]'), 'Room A must return the anonymous same-category count');
assert(!/Object\.assign\(data,\s*\{[^}]*weightKind/s.test(functionsSource), 'Room A must not bind the aggregate category to the submitted text document');
assert(functionsSource.includes('ADMIN_APP_CHECK_ENFORCED = true'), 'Private moderation functions must enforce App Check');
assert(functionsSource.includes('PUBLIC_REPORT_APP_CHECK_ENFORCED = false'), 'Public reports must remain in monitored rollout mode');
assert(functionsSource.includes('enforceAppCheck:ADMIN_APP_CHECK_ENFORCED'), 'Admin callables must use the enforcement flag');
assert(functionsSource.includes("where('status', '==', 'open')"), 'Admin report listing must query only open reports');
assert(functionsSource.includes('FieldPath.documentId()'), 'Admin report pagination must have a stable document cursor');

const reportIndex = indexes.indexes?.find(index => index.collectionGroup === 'content_reports');
assert(reportIndex, 'Open moderation reports must have a composite index');

console.log(`Site checks passed for ${pages.length} pages.`);
