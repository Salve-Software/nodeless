import type { BuildMode } from './build-mode.js';

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
}
