import type { EsbuildApi, Resolver, Vfs } from '@/types/index.js';

/** `cwd` is what `process.cwd()` returns inside the toolchain, and roots its relative paths. */
export interface ModuleRuntimeOptions {
  vfs: Vfs;
  resolver: Resolver;
  esbuild?: EsbuildApi;
  wasmURL?: string;
  cwd?: string;
  env?: Record<string, string>;
}
