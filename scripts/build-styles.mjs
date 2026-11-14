import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = new URL('../styles/', import.meta.url);
const output = new URL('../styles.css', import.meta.url);
const names = JSON.parse(readFileSync(new URL('manifest.json', root), 'utf8'));
assert(Array.isArray(names) && names.length > 0, 'CSS manifest must contain ordered source files');
assert(names.every(name => typeof name === 'string' && /^[a-z0-9-]+\.css$/.test(name)), 'CSS manifest paths must be local CSS filenames');
assert.equal(new Set(names).size, names.length, 'CSS manifest must not repeat files');
assert.deepEqual([...names].sort(), readdirSync(root).filter(name => name.endsWith('.css')).sort(), 'Every CSS source must appear exactly once in the manifest');
const built = Buffer.concat(names.map(name => readFileSync(new URL(name, root))));
const args = process.argv.slice(2);
assert(args.length === 0 || (args.length === 1 && args[0] === '--check'), 'Usage: node scripts/build-styles.mjs [--check]');
if (args[0] === '--check') {
    assert(built.equals(readFileSync(output)), 'styles.css is stale. Run npm run build:css and commit the output.');
    console.log(`CSS bundle matches ${names.length} ordered sources.`);
} else {
    writeFileSync(output, built);
    console.log(`Built ${fileURLToPath(output)} from ${names.length} ordered sources.`);
}
