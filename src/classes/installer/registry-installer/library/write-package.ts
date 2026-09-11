import type { FileMap, Vfs } from '@/types/index.js';
import { joinPath } from '@/library/index.js';

/** Wipes the directory first, so reinstalling over an older copy leaves nothing behind. */
export function writePackage(
  vfs: Vfs,
  { dir, files }: { dir: string; files: FileMap },
): void {
  vfs.rm(dir, { recursive: true });

  for (const [path, bytes] of Object.entries(files))
    vfs.writeFile(joinPath(dir, path), bytes);
}
