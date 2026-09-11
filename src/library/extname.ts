import { basename } from './basename.js';

export function extname(path: string): string {
  const name = basename(path);
  const index = name.lastIndexOf('.');

  // `.env` is a whole name, not an extension — hence `> 0` instead of `>= 0`.
  return index > 0 ? name.slice(index) : '';
}
