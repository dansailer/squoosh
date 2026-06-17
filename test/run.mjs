/**
 * Cross-platform test runner. Node's --test flag does not accept a directory
 * path, so we discover test files with glob and pass them explicitly.
 */
import { spawnSync } from 'node:child_process';
import { globSync } from '../lib/glob-files.js';

const files = [
  ...globSync('test/**/*.test.js'),
  ...globSync('test/**/*.test.ts'),
].sort();

if (files.length === 0) {
  console.error('No test files found');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--experimental-strip-types', '--test', ...files],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);