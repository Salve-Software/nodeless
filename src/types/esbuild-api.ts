import type * as Esbuild from 'esbuild-wasm';

/** The slice of esbuild the library uses. Node's native esbuild has no `initialize`. */
export type EsbuildApi = Pick<typeof Esbuild, 'build'> &
  Partial<Pick<typeof Esbuild, 'initialize'>>;
