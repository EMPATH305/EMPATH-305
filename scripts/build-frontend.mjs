import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('../frontend/', import.meta.url);
const output = new URL('../firebase-app.js', import.meta.url);
const names = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
assert(Array.isArray(names) && names.length > 0, 'Frontend manifest must contain ordered source files');
assert(names.every(name => typeof name === 'string' && /^[a-z0-9-]+\.js$/.test(name)), 'Frontend manifest paths must be local Frontend filenames');
assert.equal(new Set(names).size, names.length, 'Frontend manifest must not repeat files');
assert.deepEqual([...names].sort(), readdirSync(root).filter(name => name.endsWith('.js')).sort(), 'Every Frontend source must appear exactly once in the manifest');
const built = Buffer.concat(names.map(name => readFileSync(new URL(name, root))));
const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 1 && args[0] === '--check'), 'Usage: node scripts/build-frontend.mjs [--check]');
if (args[0] === '--check') {
    assert(built.equals(readFileSync(output)), 'firebase-app.js is stale. Run npm run build:frontend and commit the output.');
    console.log(`Frontend bundle matches ${names.length} ordered sources.`);
} else {
    writeFileSync(output, built);
    console.log(`Built ${fileURLToPath(output)} from ${names.length} ordered sources.`);
}
