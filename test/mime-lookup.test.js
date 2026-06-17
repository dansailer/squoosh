import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookup } from '../lib/mime-lookup.js';

test('lookup returns mime type for known extensions', () => {
  assert.equal(lookup('photo.png'), 'image/png');
  assert.equal(lookup('photo.JPG'), 'image/jpeg');
  assert.equal(lookup('/assets/logo.svg'), 'image/svg+xml');
  assert.equal(lookup('codec.wasm'), 'application/wasm');
  assert.equal(lookup('styles.css'), 'text/css');
  assert.equal(lookup('bundle.js'), 'text/javascript');
  assert.equal(lookup('data.json'), 'application/json');
  assert.equal(lookup('icon.woff2'), 'font/woff2');
  assert.equal(lookup('image.avif'), 'image/avif');
  assert.equal(lookup('image.webp'), 'image/webp');
});

test('lookup returns false for unknown extensions', () => {
  assert.equal(lookup('file.unknown'), false);
  assert.equal(lookup('noextension'), false);
  assert.equal(lookup(''), false);
});