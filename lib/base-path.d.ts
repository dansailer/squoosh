export function normalizeBasePath(basePath: string | undefined): string;
export function getBasePath(): string;
export function toAbsoluteUrl(path: string, basePath?: string): string;
export function stripBasePath(pathname: string, basePath?: string): string;