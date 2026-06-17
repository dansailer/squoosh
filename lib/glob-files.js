/**
 * Thin wrapper around Node's built-in glob (Node 22+).
 * Replaces the `glob` package for this project's usage patterns.
 */
import { glob as fsGlob } from 'node:fs/promises';
import { globSync as fsGlobSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * @param {string} pattern
 * @param {{ cwd?: string, absolute?: boolean }} [options]
 */
export async function glob(pattern, { cwd = process.cwd(), absolute = false } = {}) {
  const paths = [];
  for await (const entry of fsGlob(pattern, { cwd })) {
    paths.push(entry);
  }
  if (!absolute) return paths;
  return paths.map((entry) => resolve(cwd, entry));
}

/**
 * @param {string} pattern
 * @param {{ cwd?: string, absolute?: boolean }} [options]
 */
export function globSync(pattern, { cwd = process.cwd(), absolute = false } = {}) {
  const paths = fsGlobSync(pattern, { cwd });
  if (!absolute) return paths;
  return paths.map((entry) => resolve(cwd, entry));
}