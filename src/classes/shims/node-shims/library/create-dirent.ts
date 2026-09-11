import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';
import type { Vfs } from '@/types/index.js';
import { joinPath } from '@/library/index.js';

export function createDirent(
  vfs: Vfs,
  { dir, name }: { dir: string; name: string },
): ShimModule {
  const type = vfs.stat(joinPath(dir, name))?.type;

  return {
    name,
    path: dir,
    parentPath: dir,
    isFile: () => type === 'file',
    isDirectory: () => type === 'directory',
    isSymbolicLink: () => false,
  };
}
