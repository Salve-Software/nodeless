import { ROOT_PATH } from '@/constants/index.js';

/** Every VFS path is POSIX and absolute. A relative one is read from the root. */
export function normalizePath(path: string): string {
  const segments: string[] = [];

  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return segments.length === 0 ? ROOT_PATH : `/${segments.join('/')}`;
}
