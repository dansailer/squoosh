/** Normalized base path injected at build time, e.g. '' or '/squoosh'. */
export function getBasePath(): string {
  return __BASE_PATH__;
}

/** Prefix an absolute app path with the deploy base path. */
export function withBasePath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = getBasePath();
  return `${base}${normalized}`;
}

/** Remove the deploy base path from a URL pathname. */
export function stripBasePath(pathname: string): string {
  const base = getBasePath();
  if (!base) return pathname;
  if (pathname === base || pathname === `${base}/`) return '/';
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length) || '/';
  }
  return pathname;
}

/** Whether the pathname is the app root (with or without base path). */
export function isAppRoot(pathname: string): boolean {
  const stripped = stripBasePath(pathname);
  return stripped === '/' || stripped === '';
}