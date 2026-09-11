import type { EsbuildApi } from '@/types/index.js';

/** Some CDNs serve esbuild-wasm through a CJS shim whose whole API sits on `default`. */
export function unwrapEsbuild(module: unknown): EsbuildApi {
  const candidate = module as EsbuildApi & { default?: EsbuildApi };

  return typeof candidate.build === 'function'
    ? candidate
    : (candidate.default ?? candidate);
}
