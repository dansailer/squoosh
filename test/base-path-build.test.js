import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const buildDir = 'build';

test('build with BASE_PATH prefixes asset and manifest URLs', () => {
  const build = spawnSync(
    process.execPath,
    ['./node_modules/rollup/dist/bin/rollup', '-c', 'rollup.config.mjs'],
    {
      env: { ...process.env, BASE_PATH: '/squoosh' },
      stdio: 'pipe',
      encoding: 'utf8',
    },
  );

  assert.equal(
    build.status,
    0,
    `rollup failed:\n${build.stdout}\n${build.stderr}`,
  );

  const move = spawnSync(process.execPath, ['lib/move-output.mjs'], {
    env: { ...process.env, BASE_PATH: '/squoosh' },
    stdio: 'pipe',
    encoding: 'utf8',
  });

  assert.equal(
    move.status,
    0,
    `move-output failed:\n${move.stdout}\n${move.stderr}`,
  );

  assert.ok(existsSync(join(buildDir, 'index.html')));

  const html = readFileSync(join(buildDir, 'index.html'), 'utf8');
  assert.match(html, /base href="\/squoosh\/"/);
  assert.match(html, /href="\/squoosh\/manifest\.json"/);

  const manifest = JSON.parse(
    readFileSync(join(buildDir, 'manifest.json'), 'utf8'),
  );
  assert.match(manifest.start_url, /^\/squoosh\//);
  assert.match(manifest.icons[0].src, /^\/squoosh\/c\//);

  const redirects = readFileSync(join(buildDir, '_redirects'), 'utf8');
  assert.equal(redirects, '/squoosh/editor /squoosh/ 301\n');

  // Restore the default build for other integration tests.
  const restore = spawnSync(
    process.execPath,
    ['./node_modules/rollup/dist/bin/rollup', '-c', 'rollup.config.mjs'],
    { stdio: 'pipe', encoding: 'utf8' },
  );
  assert.equal(restore.status, 0);
  spawnSync(process.execPath, ['lib/move-output.mjs'], { stdio: 'pipe' });
});