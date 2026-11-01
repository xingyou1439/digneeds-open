import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('..', import.meta.url));
const run = (...args) => spawnSync(process.execPath, ['bin/digneeds.mjs', ...args], { cwd, encoding: 'utf8' });
test('CLI produces parseable evidence and identifies synthetic input', () => {
  const result = run('examples/portable-blender.json');
  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.samples, 2);
  assert.equal(report.summary.buy, 1);
  assert.match(report.inputNotice, /Synthetic/);
  assert.equal(report.posts.some(p => p.subreddit === 'deals'), false);
});
test('CLI does not silently supply a query or example on invalid input', () => {
  assert.notEqual(run().status, 0);
  assert.notEqual(run('missing.json').status, 0);
  assert.notEqual(run('package.json').status, 0);
  assert.equal(JSON.parse(run('examples/portable-blender.json', 'dog food').stdout).summary.samples, 0);
});
