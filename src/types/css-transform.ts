import type { Vfs } from './vfs.js';

/** Runs over every stylesheet before esbuild sees it. `vfs` is there for Tailwind to scan. */
export type CssTransform = (input: {
  path: string;
  css: string;
  vfs: Vfs;
}) => string | Promise<string>;
