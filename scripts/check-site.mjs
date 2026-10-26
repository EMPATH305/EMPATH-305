import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pages = ['index.html', 'room-e.html', 'room-m.html', 'room-p.html', 'room-a.html', 'room-t.html', 'room-h.html'];
const requiredAssets = ['styles.css?v=20.4', 'safety-guard.js?v=20.4', 'firebase-app.js?v=20.4', 'interactions.js?v=20.4', 'room-router.js?v=20.4'];

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
assert(appSource.includes("collection(db, 'content_reports')"), 'Anonymous content reports must be persisted');
assert(appSource.includes('new Uint8Array(16)'), 'New Soul Keys must use 128 bits of entropy');
assert(appSource.includes("allowAction('soul-key-load'"), 'Soul Key lookups must be locally throttled');

const rules = readFileSync('firestore.rules', 'utf8');
assert(rules.includes('allow get: if resource.data.expireAt is timestamp'), 'Rules must deny direct reads of expired Room A records');
assert(rules.includes('request.query.limit <= 30'), 'Room A collection reads must be bounded');
assert(rules.includes('allow read, write: if false'), 'Rules must deny undeclared collections by default');
assert(rules.includes('match /metadata/room_a_stats'), 'Rules must protect the Room A aggregate counter');
assert(rules.includes('match /metadata/silent_presence'), 'Rules must protect silent companionship counts');
assert(rules.includes('match /content_reports/{reportId}'), 'Rules must validate anonymous content reports');
assert(rules.includes("'targetCollection', 'targetId', 'reason', 'createdAt'"), 'Reports must use a minimal schema');
assert(rules.includes('EMP-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}-[A-Z0-9]{8}'), 'Rules must accept v20.3 Soul Keys');

const indexes = JSON.parse(readFileSync('firestore.indexes.json', 'utf8'));
const ttlField = indexes.fieldOverrides?.find((field) => field.collectionGroup === 'sand' && field.fieldPath === 'expireAt');
assert.equal(ttlField?.ttl, true, 'Room A expireAt must be configured as a TTL field');

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
for (const icon of manifest.icons) {
  const png = readFileSync(icon.src.replace(/^\.\//, ''));
  assert.equal(png.toString('ascii', 1, 4), 'PNG', `${icon.src}: not a PNG file`);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  assert.equal(`${width}x${height}`, icon.sizes, `${icon.src}: declared and actual dimensions differ`);
}

const serviceWorker = readFileSync('sw.js', 'utf8');
assert(serviceWorker.includes('empath-cache-v20.4'), 'Service worker cache must be bumped for v20.4');
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

console.log(`Site checks passed for ${pages.length} pages.`);
