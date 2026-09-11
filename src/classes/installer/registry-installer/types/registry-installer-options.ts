import type { PackageCache, Vfs } from '@/types/index.js';

/** `fetch` is injectable so tests never touch the network and private registries can add auth. */
export interface RegistryInstallerOptions {
  vfs: Vfs;
  registryUrl?: string;
  cache?: PackageCache;
  fetch?: typeof fetch;
}
