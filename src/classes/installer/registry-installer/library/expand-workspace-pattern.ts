import type { Vfs } from '@/types/index.js';
import { joinPath } from '@/library/index.js';

/** Only a `*` standing for one whole segment, which is what `packages/*` needs. */
export function expandWorkspacePattern(vfs: Vfs, pattern: string): string[] {
  return pattern
    .split('/')
    .filter(Boolean)
    .reduce<string[]>(
      (dirs, segment) =>
        dirs.flatMap((dir) =>
          segment === '*'
            ? children(vfs, dir)
            : vfs.stat(joinPath(dir, segment))?.type === 'directory'
              ? [joinPath(dir, segment)]
              : [],
        ),
      ['/'],
    );
}

function children(vfs: Vfs, dir: string): string[] {
  try {
    return vfs
      .readdir(dir)
      .map((entry) => joinPath(dir, entry))
      .filter((path) => vfs.stat(path)?.type === 'directory');
  } catch {
    return [];
  }
}
