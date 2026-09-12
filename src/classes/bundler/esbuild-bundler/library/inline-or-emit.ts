import type { Loader } from 'esbuild-wasm';

/** Past the limit an asset becomes its own output file, so the bundle stays cacheable. */
export function inlineOrEmit(
  loader: Loader,
  { size, limit }: { size: number; limit: number },
): Loader {
  return loader === 'dataurl' && size > limit ? 'file' : loader;
}
