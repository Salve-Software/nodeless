import type { PackageManifest } from './package-manifest.js';
import type { Vfs } from '@/types/index.js';

/** What the resolution functions need to know. `readManifest` arrives cached from the class. */
export interface ResolveScope {
  vfs: Vfs;
  conditions: string[];
  extensions: string[];
  readManifest(dir: string): PackageManifest | undefined;
}
