import type { Bundler } from './bundler.js';
import type { EsbuildApi } from './esbuild-api.js';
import type { FileInput } from './file-input.js';
import type { Installer } from './installer.js';
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
}
