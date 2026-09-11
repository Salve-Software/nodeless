import type { FileMap, PackageCache } from '@/types/index.js';

/** The default cache: lives as long as the process. Swap it for IndexedDB or disk. */
export class MemoryPackageCache implements PackageCache {
  private readonly entries = new Map<string, FileMap>();

  async get(key: string): Promise<FileMap | undefined> {
    return this.entries.get(key);
  }

  async set(key: string, files: FileMap): Promise<void> {
    this.entries.set(key, files);
  }
}
