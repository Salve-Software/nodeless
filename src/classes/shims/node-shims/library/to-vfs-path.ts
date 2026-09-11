import { FILE_SCHEME } from '@/classes/shims/node-shims/constants/index.js';
import { normalizePath } from '@/library/index.js';
import { posixResolve } from './posix-resolve.js';

/** A shim takes a string, a `file://` URL or a Buffer, and the VFS takes one shape. */
export function toVfsPath(path: unknown, cwd: string): string {
  const raw = path instanceof URL ? path.href : String(path);
  const stripped = raw.startsWith(FILE_SCHEME)
    ? decodeURIComponent(raw.slice(FILE_SCHEME.length))
    : raw;

  return normalizePath(posixResolve([stripped], cwd));
}
