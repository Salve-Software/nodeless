import { ROOT_PATH } from '@/constants/index.js';
import { basename, dirname, joinPath, normalizePath } from '@/library/index.js';

/** Candidate `node_modules` directories, nearest to the importer first, up to the root. */
export function nodeModulesDirs(fromDir: string): string[] {
  const dirs: string[] = [];
  let current = normalizePath(fromDir);

  for (;;) {
    if (basename(current) !== 'node_modules')
      dirs.push(joinPath(current, 'node_modules'));
    if (current === ROOT_PATH) break;
    current = dirname(current);
  }

  return dirs;
}
