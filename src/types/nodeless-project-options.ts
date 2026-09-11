import type { Bundler } from './bundler.js';
import type { EsbuildApi } from './esbuild-api.js';
import type { FileInput } from './file-input.js';
import type { Installer } from './installer.js';
import type { PackageCache } from './package-cache.js';
import type { Plugin } from './plugin.js';
import type { Runtime } from './runtime.js';
import type { VfsSnapshot } from './vfs-snapshot.js';
import type { Vfs } from './vfs.js';

/** Everything is optional. `vfs` takes precedence over `files` and `snapshot`. */
export interface NodelessProjectOptions {
  files?: FileInput;
  snapshot?: VfsSnapshot;
  vfs?: Vfs;
  bundler?: Bundler;
  installer?: Installer;
  runtime?: Runtime;
  conditions?: string[];
  wasmURL?: string;
  esbuild?: EsbuildApi;
  /** Run before the project's own config plugins, which run before the built-in ones. */
  plugins?: Plugin[];
  registryUrl?: string;
  packageCache?: PackageCache;
  fetch?: typeof fetch;
}
