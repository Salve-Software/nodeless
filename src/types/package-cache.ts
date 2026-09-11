import type { FileMap } from './file-map.js';

/** Extracted tarballs keyed by `name@version`. Async so IndexedDB or disk can back it. */
export interface PackageCache {
  get(key: string): Promise<FileMap | undefined>;
  set(key: string, files: FileMap): Promise<void>;
}
