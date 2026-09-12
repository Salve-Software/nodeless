import type { EsbuildApi, Resolver, Vfs } from '@/types/index.js';

/** `isShimmed` decides what gets rewritten to the standard library before anything runs. */
export interface BundleModuleScope {
  vfs: Vfs;
  resolver: Resolver;
  isShimmed: (specifier: string) => boolean;
  esbuild?: EsbuildApi;
  wasmURL?: string;
}
