import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from '../lib/glob-files.js';

const buildDir = 'build';
const buildExists = existsSync(buildDir);

const forbiddenTrackers = [
  'google-analytics',
  'googletagmanager',
  'gtag(',
  'analytics.js',
  'plausible.io',
  'clarity.ms',
  'segment.com',
  'mixpanel.com',
  'hotjar.com',
  'sentry.io',
  'facebook.net/fbevents',
];

function assertNoTrackers(content, file) {
  for (const pattern of forbiddenTrackers) {
    assert.equal(
      content.includes(pattern),
      false,
      `${file} must not contain ${pattern}`,
    );
  }
}

test('build output contains expected entry files', { skip: !buildExists }, () => {
  assert.ok(existsSync(join(buildDir, 'index.html')));
  assert.ok(existsSync(join(buildDir, '404.html')));
  assert.ok(existsSync(join(buildDir, 'manifest.json')));
  assert.ok(existsSync(join(buildDir, 'sw.js')));
  assert.ok(existsSync(join(buildDir, '_headers')));
});

test('build output has no analytics or third-party trackers', { skip: !buildExists }, () => {
  const jsFiles = globSync(join(buildDir, '**/*.js'));
  assert.ok(jsFiles.length > 0);

  for (const file of jsFiles) {
    assertNoTrackers(readFileSync(file, 'utf8'), file);
  }
});

test('index.html has no analytics or third-party trackers', { skip: !buildExists }, () => {
  const html = readFileSync(join(buildDir, 'index.html'), 'utf8');
  assertNoTrackers(html, 'index.html');
  assert.match(html, /<title>Squoosh<\/title>/);
});

test('manifest.json references self-hosted icons', { skip: !buildExists }, () => {
  const manifest = JSON.parse(readFileSync(join(buildDir, 'manifest.json'), 'utf8'));

  assert.equal(manifest.name, 'Squoosh');
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.length > 0);

  for (const icon of manifest.icons) {
    assert.match(icon.src, /^\/c\//);
    assert.match(icon.type, /^image\//);
  }
});

test('_headers configures COOP and COEP for WebAssembly threads', { skip: !buildExists }, () => {
  const headers = readFileSync(join(buildDir, '_headers'), 'utf8');

  assert.match(headers, /Cross-Origin-Embedder-Policy:\s*require-corp/);
  assert.match(headers, /Cross-Origin-Opener-Policy:\s*same-origin/);
});