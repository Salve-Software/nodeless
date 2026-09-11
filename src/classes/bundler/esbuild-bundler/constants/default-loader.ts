import type { Loader } from 'esbuild-wasm';

/** An unknown extension comes in as text, never as executable code. */
export const DEFAULT_LOADER: Loader = 'text';
