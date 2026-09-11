import type { Vfs } from '@/types/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { joinPath } from '@/library/index.js';

/** Only a `*` standing for one whole segment, which is what `packages/*` needs. */
export function expandWorkspacePattern(vfs: Vfs, pattern: string): string[] {
  let dirs = [ROOT_PATH];

  for (const segment of pattern.split('/').filter(Boolean)) {
    dirs = dirs.flatMap((dir) =>
      segment === '*' ? childDirs(vfs, dir) : keepDir(vfs, joinPath(dir, segment)),
    );
  }

  return dirs;
}

function childDirs(vfs: Vfs, dir: string): string[] {
  try {
    return vfs.readdir(dir).flatMap((entry) => keepDir(vfs, joinPath(dir, entry)));
  } catch {
    return [];
  }
}

function keepDir(vfs: Vfs, path: string): string[] {
  return vfs.stat(path)?.type === 'directory' ? [path] : [];
}
