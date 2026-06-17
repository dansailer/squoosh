/** Build-time base path helpers (mirrors lib/base-path.js). */

function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath || basePath === '/') return '';
  let normalized = basePath.startsWith('/') ? basePath : `/${basePath}`;
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return normalized;
}

export function getBasePath(): string {
  return normalizeBasePath(process.env.BASE_PATH);
}

export function toAbsoluteUrl(path: string, basePath = getBasePath()): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalized}`;
}