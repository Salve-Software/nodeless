import { ROOT_PATH } from '@/constants/index.js';
import { dirname, normalizePath } from '@/library/index.js';

/** Root down to `path`, inclusive. This is what keeps `readdir` honest about empty folders. */
export function ancestorDirs(path: string): string[] {
  const dirs: string[] = [];
  let current = normalizePath(path);

  while (current !== ROOT_PATH) {
    dirs.unshift(current);
    current = dirname(current);
  }

  dirs.unshift(ROOT_PATH);

  return dirs;
}
