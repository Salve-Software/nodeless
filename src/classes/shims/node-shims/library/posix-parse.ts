import type { ParsedPath } from '@/classes/shims/node-shims/types/index.js';
import { posixBasename } from './posix-basename.js';
import { posixDirname } from './posix-dirname.js';
import { posixExtname } from './posix-extname.js';

export function posixParse(path: string): ParsedPath {
  const base = posixBasename(path);
  const ext = posixExtname(path);

  return {
    root: path.startsWith('/') ? '/' : '',
    dir: path.includes('/') ? posixDirname(path) : '',
    base,
    ext,
    name: ext === '' ? base : base.slice(0, -ext.length),
  };
}
