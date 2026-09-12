import type { Bundler } from './bundler.js';
import type { EsbuildApi } from './esbuild-api.js';
import type { FileInput } from './file-input.js';
import type { Installer } from './installer.js';
import type { IsolationMode } from './isolation-mode.js';
import type { PackageCache } from './package-cache.js';
import type { Plugin } from './plugin.js';
import type { RuntimeChannel } from './runtime-channel.js';
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
  /** Defaults to `none`. `worker` runs the config graph off the page, and needs a browser. */
  isolation?: IsolationMode;
  /** Only read when `isolation` is `worker`, and only when the default URL is wrong. */
  workerUrl?: string;
  /** Where a worker comes from. Defaults to a browser `Worker`; Node hosts pass their own. */
  channel?: () => RuntimeChannel;
  conditions?: string[];
  wasmURL?: string;
  esbuild?: EsbuildApi;
  /** Run before the project's own config plugins, which run before the built-in ones. */
  plugins?: Plugin[];
  registryUrl?: string;
  packageCache?: PackageCache;
  fetch?: typeof fetch;
}
