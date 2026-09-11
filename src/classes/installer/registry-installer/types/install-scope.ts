import type { Packument } from './packument.js';
import type { FileMap, PackageCache, Vfs } from '@/types/index.js';

/** What the installer library functions need. The maps dedupe work inside one run. */
export interface InstallScope {
  vfs: Vfs;
  registryUrl: string;
  fetch: typeof fetch;
  cache: PackageCache;
  packuments: Map<string, Promise<Packument>>;
  downloads: Map<string, Promise<FileMap>>;
  /** Package name to the directory holding it, for anything `workspaces` points at. */
  workspaces: Map<string, string>;
}
