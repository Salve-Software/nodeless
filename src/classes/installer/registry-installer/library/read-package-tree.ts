import type { FileMap, Vfs } from '@/types/index.js';

/** Everything under a directory, keyed relative to it, so it can be written elsewhere. */
export function readPackageTree(vfs: Vfs, dir: string): FileMap {
  const prefix = `${dir}/`;
  const files: FileMap = {};

  for (const path of vfs.paths()) {
    if (!path.startsWith(prefix)) continue;
    // A workspace package keeps its own node_modules; copying it would duplicate the tree.
    if (path.slice(prefix.length).startsWith('node_modules/')) continue;
    files[path.slice(prefix.length)] = vfs.readFile(path);
  }

  return files;
}
