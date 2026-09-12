import type { ShimRequire } from './shim-require.js';
import type { Vfs } from '@/types/index.js';

/** `env` is what the toolchain reads off `process.env`; `cwd` roots every relative path. */
export interface NodeShimsOptions {
  vfs: Vfs;
  cwd?: string;
  env?: Record<string, string>;
  require?: ShimRequire;
}
