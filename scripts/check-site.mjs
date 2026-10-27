import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = ['index.html', 'room-e.html', 'room-m.html', 'room-p.html', 'room-a.html', 'room-t.html', 'room-h.html'];
const requiredAssets = ['styles.css?v=20.5.1', 'safety-guard.js?v=20.5', 'firebase-app.js?v=20.5', 'interactions.js?v=20.5', 'room-router.js?v=20.5'];

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
assert(/#room-a\s+\.a-collective-count\s*\{[^}]*grid-column:\s*7\/13!important;[^}]*grid-row:\s*6!important;/s.test(styles), 'Room A collective count must occupy the right content column');
assert(/#room-a\s+#a-feed-wrapper\s*\{[^}]*grid-column:\s*1\/13!important;[^}]*grid-row:\s*8!important;/s.test(styles), 'Room A feed must remain below the collective count and safety note');
assert(/where\(["']expireAt["'],\s*["']>["'],\s*roomAQueryCutoff\(\)\)/.test(appSource), 'Room A must hide expired records at query time');
assert(appSource.includes('Date.now() + 10000'), 'Room A query cutoff must stay ahead of Firestore request.time');
assert(appSource.includes('expireAt: Timestamp.fromMillis'), 'Room A writes must include a Firestore TTL timestamp');
assert(appSource.includes('empath_analytics_consent'), 'Analytics must be consent gated');
assert(appSource.includes('empath_crisis_region'), 'Crisis support must use an explicit region preference');
assert(!appSource.includes('randomMsg.slice'), 'Room A must never replay expired message fragments');
assert(appSource.includes("doc(db, 'metadata', 'room_a_stats')"), 'Room A must use anonymous aggregate counts');
assert(appSource.includes('startSilentCompanionship'), 'Room H must expose silent companionship mode');
assert(appSource.includes('initializeAppCheck'), 'Firebase App Check must be wired into the client');
assert(/APP_CHECK_ENTERPRISE_SITE_KEY\s*=\s*['"]6L[A-Za-z0-9_-]+['"]/.test(appSource), 'Production App Check site key must be configured');
assert(appSource.includes("httpsCallable(functions, 'submitContentReport')"), 'Anonymous reports must use the rate-limited backend');
assert(!appSource.includes("addDoc(collection(db, 'content_reports')"), 'Clients must not write reports directly');
assert(appSource.includes('new Uint8Array(16)'), 'New Soul Keys must use 128 bits of entropy');
assert(appSource.includes("allowAction('soul-key-load'"), 'Soul Key lookups must be locally throttled');

const rules = readFileSync('firestore.rules', 'utf8');
assert(rules.includes('allow get: if resource.data.expireAt is timestamp'), 'Rules must deny direct reads of expired Room A records');
assert(rules.includes('request.query.limit <= 30'), 'Room A collection reads must be bounded');
assert(rules.includes('allow read, write: if false'), 'Rules must deny undeclared collections by default');
assert(rules.includes('match /metadata/room_a_stats'), 'Rules must protect the Room A aggregate counter');
assert(rules.includes('match /metadata/silent_presence'), 'Rules must protect silent companionship counts');
assert(rules.includes('match /content_reports/{reportId}'), 'Rules must validate anonymous content reports');
assert(rules.includes('match /rate_limits/{bucketId}'), 'Rate-limit documents must be private');
assert(rules.includes('match /moderation_audit/{entryId}'), 'Moderation audit records must be private');
assert(rules.includes('EMP-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}'), 'Rules must accept v20.3 Soul Keys');

const indexes = JSON.parse(readFileSync('firestore.indexes.json', 'utf8'));
const ttlField = indexes.fieldOverrides?.find((field) => field.collectionGroup === 'sand' && field.fieldPath === 'expireAt');
assert.equal(ttlField?.ttl, true, 'Room A expireAt must be configured as a TTL field');
const rateLimitTtl = indexes.fieldOverrides?.find((field) => field.collectionGroup === 'rate_limits' && field.fieldPath === 'expiresAt');
assert.equal(rateLimitTtl?.ttl, true, 'Rate-limit buckets must expire automatically');

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
for (const icon of manifest.icons) {
  const png = readFileSync(icon.src.replace(/^\.\//, ''));
  assert.equal(png.toString('ascii', 1, 4), 'PNG', `${icon.src}: not a PNG file`);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(`${width}x${height}`, icon.sizes, `${icon.src}: declared and actual dimensions differ`);
}

const serviceWorker = readFileSync('sw.js', 'utf8');
assert(serviceWorker.includes('empath-cache-v20.5.1'), 'Service worker cache must be bumped for v20.5.1');
assert(serviceWorker.includes("'./safety-guard.js'"), 'Service worker must precache the safety layer');
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
assert(adminPage.includes('admin-app.js?v=20.5'), 'Admin route must load the current controller');
assert(adminSource.includes("httpsCallable(functions, 'claimAdminRole')"), 'Admin access must be granted by the backend');
assert(adminSource.includes("httpsCallable(functions, 'moderateReport')"), 'Moderation actions must use the backend');
assert(!adminSource.includes('@gmail.com'), 'Admin email must never be embedded in the client');

const firebaseSettings = JSON.parse(readFileSync('firebase.json', 'utf8'));
assert.equal(firebaseSettings.functions?.runtime, 'nodejs22', 'Functions must use the supported Node.js 22 runtime');
const functionsSource = readFileSync('functions/index.js', 'utf8');
assert(functionsSource.includes("defineSecret('ADMIN_EMAIL')"), 'Admin identity must be stored in Secret Manager');
assert(functionsSource.includes("defineSecret('RATE_LIMIT_SALT')"), 'Rate-limit salt must be stored in Secret Manager');
assert(functionsSource.includes('REPORT_LIMIT_PER_HOUR = 8'), 'Server-side report limit must remain bounded');

console.log(`Site checks passed for ${pages.length} pages.`);
