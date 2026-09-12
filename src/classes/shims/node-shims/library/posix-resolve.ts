import { posixNormalize } from './posix-normalize.js';

/** Right to left until a segment is absolute, then `cwd` — Node's `path.resolve`. */
export function posixResolve(paths: string[], cwd: string): string {
  let resolved = '';

  for (const path of [...paths].reverse()) {
    if (path === '') continue;
    resolved = resolved === '' ? path : `${path}/${resolved}`;
    if (path.startsWith('/')) return posixNormalize(resolved);
  }

  return posixNormalize(resolved === '' ? cwd : `${cwd}/${resolved}`);
}
