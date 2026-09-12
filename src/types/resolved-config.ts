import type { BuildMode } from './build-mode.js';

/** The subset of a resolved build a plugin is told about, before any module is read. */
export interface ResolvedConfig {
  root: string;
  mode: BuildMode;
  entry: string;
  outdir: string;
  env: Record<string, string>;
}
