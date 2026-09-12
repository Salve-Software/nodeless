import type { FileMap, Vfs } from '@/types/index.js';
import { normalizePath } from '@/library/index.js';

/** Vite copies `public/` to the dist untouched, and the scaffold HTML links straight into it. */
export function collectPublicFiles(vfs: Vfs, publicDir: string): FileMap {
  const prefix = `${normalizePath(publicDir)}/`;
  const files: FileMap = {};

  for (const path of vfs.paths()) {
    if (path.startsWith(prefix)) files[path.slice(prefix.length)] = vfs.readFile(path);
  }

  return files;
}
