import type * as Esbuild from 'esbuild-wasm';

/**
 * The slice of esbuild this library uses. `initialize` is optional because Node's
 * native esbuild has none — and that is the one you inject here when speed matters.
 */
export type EsbuildApi = Pick<typeof Esbuild, 'build'> &
  Partial<Pick<typeof Esbuild, 'initialize'>>;
