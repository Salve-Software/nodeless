import type { Vfs } from '@/types/index.js';
import { bytesToBase64 } from '@/library/index.js';

/** Reads the dirty paths out of the VFS. A path written and then deleted is only a removal. */
export function collectVfsPatch(
  vfs: Vfs,
  dirty: { written: Set<string>; removed: Set<string> },
): { written: Record<string, string>; removed: string[] } {
  const written: Record<string, string> = {};

  for (const path of dirty.written) {
    const bytes = vfs.tryReadFile(path);

    if (bytes) written[path] = bytesToBase64(bytes);
  }

  return {
    written,
    removed: [...dirty.removed].filter((path) => !vfs.exists(path)),
  };
}
