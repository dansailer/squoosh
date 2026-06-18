/**
 * Flatten Rollup preserveModules output under c/node_modules/ into c/.
 * GitHub Pages does not reliably serve URLs containing node_modules or .pnpm.
 */
import fs from 'fs';
import path from 'path';
import { globSync } from 'node:fs';

/**
 * @param {string} buildDir
 */
export function flattenVendorChunks(buildDir) {
  const chunksDir = path.join(buildDir, 'c');
  if (!fs.existsSync(chunksDir)) return;

  // Node's glob intentionally skips node_modules/**; .pnpm must be explicit.
  const vendorFiles = globSync('node_modules/.pnpm/**/*.js', {
    cwd: chunksDir,
    dot: true,
  });

  /** @type {Map<string, string>} */
  const pathReplacements = new Map();

  for (const relativePath of vendorFiles) {
    const posixPath = relativePath.replace(/\\/g, '/');
    const fileName = path.posix.basename(posixPath);
    const fromPath = path.join(chunksDir, relativePath);
    const toPath = path.join(chunksDir, fileName);

    if (fromPath === toPath) continue;

    if (fs.existsSync(toPath)) {
      throw new Error(`Duplicate vendor chunk name: ${fileName}`);
    }

    fs.renameSync(fromPath, toPath);

    const oldSpecifier = `./${posixPath.replace(/\.js$/, '')}`;
    const newSpecifier = `./${fileName.replace(/\.js$/, '')}`;
    pathReplacements.set(oldSpecifier, newSpecifier);
  }

  const nodeModulesDir = path.join(chunksDir, 'node_modules');
  if (fs.existsSync(nodeModulesDir)) {
    fs.rmSync(nodeModulesDir, { recursive: true, force: true });
  }

  if (pathReplacements.size === 0) return;

  const replacements = [...pathReplacements.entries()].sort(
    (a, b) => b[0].length - a[0].length,
  );

  const jsFiles = globSync('**/*.js', { cwd: buildDir });
  for (const relativePath of jsFiles) {
    const filePath = path.join(buildDir, relativePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const [oldSpecifier, newSpecifier] of replacements) {
      if (!content.includes(oldSpecifier)) continue;
      content = content.split(oldSpecifier).join(newSpecifier);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
    }
  }
}