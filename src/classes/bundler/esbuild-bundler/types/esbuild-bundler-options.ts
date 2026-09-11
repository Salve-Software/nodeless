import type { CssTransform, EsbuildApi, Resolver, Vfs } from '@/types/index.js';

/** `wasmURL` is required in the browser; `esbuild` swaps the WASM build for a native one. */
export interface EsbuildBundlerOptions {
  vfs: Vfs;
  resolver: Resolver;
  esbuild?: EsbuildApi;
  wasmURL?: string;
  cssTransform?: CssTransform;
}
