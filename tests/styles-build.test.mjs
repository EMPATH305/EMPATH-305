import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function fixture(run) {
  const root=mkdtempSync(join(tmpdir(),'empath-css-'));
  try {
    mkdirSync(join(root,'scripts'));mkdirSync(join(root,'styles'));
    copyFileSync(new URL('../scripts/build-styles.mjs',import.meta.url),join(root,'scripts/build-styles.mjs'));
    writeFileSync(join(root,'styles/a.css'),'body { color: red; }\n');
    writeFileSync(join(root,'styles/b.css'),'body { color: blue; }\n');
    writeFileSync(join(root,'styles/manifest.json'),JSON.stringify(['b.css','a.css']));
    const execute=(...args)=>spawnSync(process.execPath,[join(root,'scripts/build-styles.mjs'),...args],{cwd:tmpdir(),encoding:'utf8'});
    run(root,execute);
  } finally {rmSync(root,{recursive:true,force:true});}
}

test('CSS build preserves manifest order and bytes regardless of working directory',()=>fixture((root,execute)=>{
  assert.equal(execute().status,0);
  assert.equal(readFileSync(join(root,'styles.css'),'utf8'),'body { color: blue; }\nbody { color: red; }\n');
  assert.equal(execute('--check').status,0);
}));

test('CSS check rejects stale output without overwriting it',()=>fixture((root,execute)=>{
  assert.equal(execute().status,0);
  const before=readFileSync(join(root,'styles.css'));
  writeFileSync(join(root,'styles/a.css'),'body { color: green; }\n');
  const result=execute('--check');assert.notEqual(result.status,0);assert.match(result.stderr,/styles.css is stale/);
  assert.deepEqual(readFileSync(join(root,'styles.css')),before);
  assert.equal(execute().status,0);assert.equal(execute('--check').status,0);
}));

test('CSS manifest rejects duplicates and unlisted sources',()=>fixture((root,execute)=>{
  writeFileSync(join(root,'styles/manifest.json'),JSON.stringify(['a.css','a.css']));
  assert.match(execute().stderr,/must not repeat/);
  writeFileSync(join(root,'styles/manifest.json'),JSON.stringify(['a.css']));
  assert.match(execute().stderr,/Every CSS source/);
}));
