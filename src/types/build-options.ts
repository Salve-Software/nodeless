import type { BuildMode } from './build-mode.js';
import type { CdnOptions } from './cdn-options.js';
import type { EsbuildPlugin } from './esbuild-plugin.js';

/** Every field overrides one default. The defaults are listed in the README. */
export interface BuildOptions {
  entry?: string;
  mode?: BuildMode;
  html?: string;
  outdir?: string;
  target?: string;
  define?: Record<string, string>;
  external?: string[];
  minify?: boolean;
  sourcemap?: boolean;
  conditions?: string[];
  /** Bare imports the VFS cannot resolve become URLs instead of build errors. */
  cdn?: CdnOptions;
  /** Copied to the output untouched. Defaults to `/public`. */
  publicDir?: string;
  /** Bytes. An asset over this becomes its own file instead of a data URL. */
  assetLimit?: number;
  /** Merged into `import.meta.env`, which is otherwise undefined at runtime. */
  env?: Record<string, string>;
  /** esbuild plugins, run before the VFS one so they can claim a path first. */
  plugins?: EsbuildPlugin[];
}
