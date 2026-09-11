import type { FileInput, VfsSnapshot } from '@/types/index.js';

/** `snapshot` is applied first and `files` on top of it, so a snapshot can act as the base. */
export interface MemoryVfsOptions {
  files?: FileInput;
  snapshot?: VfsSnapshot;
}
