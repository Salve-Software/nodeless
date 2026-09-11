import { posixBasename } from './posix-basename.js';

export function posixExtname(path: string): string {
  const name = posixBasename(path);
  const index = name.lastIndexOf('.');

  // `.env` is a whole name, not an extension — hence `> 0` instead of `>= 0`.
  return index > 0 ? name.slice(index) : '';
}
