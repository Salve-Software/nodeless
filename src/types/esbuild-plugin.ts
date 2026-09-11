import type { Plugin } from 'esbuild-wasm';

/** esbuild's own plugin, for when a transform is not the right level. Runs before the VFS one. */
export type EsbuildPlugin = Plugin;
