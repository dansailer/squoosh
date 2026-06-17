/**
 * Normalize and apply a deploy base path (e.g. '' or '/squoosh').
 * Used at build time and in Node tooling.
 */

/** @param {string | undefined} basePath */
export function normalizeBasePath(basePath) {
  if (!basePath || basePath === '/') return '';
  let normalized = basePath.startsWith('/') ? basePath : `/${basePath}`;
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized;
}

export function getBasePath() {
  return normalizeBasePath(process.env.BASE_PATH);
}

/**
 * @param {string} path Absolute path starting with '/'.
 * @param {string} [basePath]
 */
export function toAbsoluteUrl(path, basePath = getBasePath()) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

/**
 * @param {string} pathname
 * @param {string} [basePath]
 */
export function stripBasePath(pathname, basePath = getBasePath()) {
  if (!basePath) return pathname;
  if (pathname === basePath || pathname === `${basePath}/`) return '/';
  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length) || '/';
  }
  return pathname;
}