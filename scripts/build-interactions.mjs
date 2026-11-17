import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('../interactions/', import.meta.url);
const output = new URL('../interactions.js', import.meta.url);
const names = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
assert(Array.isArray(names) && names.length > 0, 'Interaction manifest must contain ordered source files');
assert(names.every(name => typeof name === 'string' && /^[a-z0-9-]+\.js$/.test(name)), 'Interaction manifest paths must be local Interaction filenames');
assert.equal(new Set(names).size, names.length, 'Interaction manifest must not repeat files');
assert.deepEqual([...names].sort(), readdirSync(root).filter(name => name.endsWith('.js')).sort(), 'Every Interaction source must appear exactly once in the manifest');
const built = Buffer.concat(names.map(name => readFileSync(new URL(name, root))));
const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 1 && args[0] === '--check'), 'Usage: node scripts/build-interactions.mjs [--check]');
if (args[0] === '--check') {
    assert(built.equals(readFileSync(output)), 'interactions.js is stale. Run npm run build:interactions and commit the output.');
    console.log(`Interaction bundle matches ${names.length} ordered sources.`);
} else {
    writeFileSync(output, built);
    console.log(`Built ${fileURLToPath(output)} from ${names.length} ordered sources.`);
}
