import { test } from 'node:test';
import assert from 'node:assert/strict';
import prettyBytes from '../src/client/lazy-app/Compress/Results/pretty-bytes.ts';

test('prettyBytes formats bytes', () => {
  assert.deepEqual(prettyBytes(0), { value: '0', unit: 'B' });
  assert.deepEqual(prettyBytes(500), { value: '500', unit: 'B' });
});

test('prettyBytes formats kilobytes', () => {
  assert.deepEqual(prettyBytes(1024), { value: '1.02', unit: 'kB' });
});

test('prettyBytes formats megabytes', () => {
  assert.deepEqual(prettyBytes(1_000_000), { value: '1.00', unit: 'MB' });
});

test('prettyBytes handles sub-byte values', () => {
  assert.deepEqual(prettyBytes(0.5), { value: '0.5', unit: 'B' });
});

test('prettyBytes handles negative values', () => {
  assert.deepEqual(prettyBytes(-1024), { value: '-1.02', unit: 'kB' });
});