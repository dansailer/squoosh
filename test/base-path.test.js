import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBasePath,
  normalizeBasePath,
  stripBasePath,
  toAbsoluteUrl,
} from '../lib/base-path.js';

test('normalizeBasePath handles empty and root values', () => {
  assert.equal(normalizeBasePath(undefined), '');
  assert.equal(normalizeBasePath(''), '');
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('squoosh'), '/squoosh');
  assert.equal(normalizeBasePath('/squoosh/'), '/squoosh');
});

test('toAbsoluteUrl prefixes paths with the base path', () => {
  assert.equal(toAbsoluteUrl('/c/app.js', ''), '/c/app.js');
  assert.equal(toAbsoluteUrl('/manifest.json', '/squoosh'), '/squoosh/manifest.json');
  assert.equal(toAbsoluteUrl('c/app.js', '/squoosh'), '/squoosh/c/app.js');
});

test('stripBasePath removes the deploy prefix from pathnames', () => {
  assert.equal(stripBasePath('/c/app.js', ''), '/c/app.js');
  assert.equal(stripBasePath('/squoosh/c/app.js', '/squoosh'), '/c/app.js');
  assert.equal(stripBasePath('/squoosh', '/squoosh'), '/');
  assert.equal(stripBasePath('/squoosh/', '/squoosh'), '/');
  assert.equal(stripBasePath('/editor', '/squoosh'), '/editor');
});

test('getBasePath reads BASE_PATH from the environment', () => {
  const previous = process.env.BASE_PATH;
  process.env.BASE_PATH = '/my-app';
  assert.equal(getBasePath(), '/my-app');
  process.env.BASE_PATH = previous;
});