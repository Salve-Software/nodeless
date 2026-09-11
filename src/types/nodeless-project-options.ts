import type { Bundler } from './bundler.js';
import type { EsbuildApi } from './esbuild-api.js';
import type { FileInput } from './file-input.js';
import type { Installer } from './installer.js';
import type { PackageCache } from './package-cache.js';
import type { SourceTransform } from './source-transform.js';
import type { VfsSnapshot } from './vfs-snapshot.js';
import type { Vfs } from './vfs.js';

/** Everything is optional. `vfs` takes precedence over `files` and `snapshot`. */
export interface NodelessProjectOptions {
  files?: FileInput;
  snapshot?: VfsSnapshot;
  vfs?: Vfs;
  bundler?: Bundler;
  installer?: Installer;
  conditions?: string[];
  wasmURL?: string;
  esbuild?: EsbuildApi;
  /** Tried before the built-in ones, so they can claim a file first. */
  transforms?: SourceTransform[];
  registryUrl?: string;
  packageCache?: PackageCache;
  fetch?: typeof fetch;
}
