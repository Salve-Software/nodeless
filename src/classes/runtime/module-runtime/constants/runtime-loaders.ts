import type { Loader } from 'esbuild-wasm';

/** The config graph is code and data only: no CSS, no assets, no binary. */
export const RUNTIME_LOADERS: Record<string, Loader> = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.mts': 'ts',
  '.cts': 'ts',
  '.js': 'js',
  '.jsx': 'jsx',
  '.mjs': 'js',
  '.cjs': 'js',
  '.json': 'json',
  '.node': 'empty',
};
