import type { Vfs } from './vfs.js';

/** Runs over every stylesheet before esbuild sees it. This is where PostCSS or Tailwind plugs in. */
export type CssTransform = (input: {
  path: string;
  css: string;
  /** The whole filesystem, because a scanner needs the sources and not just this file. */
  vfs: Vfs;
  /** Node resolution from this file, so a transform need not reimplement it. */
  resolve: (specifier: string) => string | undefined;
}) => string | Promise<string>;
