import type { Vfs } from './vfs.js';

export interface TransformInput {
  path: string;
  content: string;
  /** The whole filesystem, because a scanner needs the sources and not just this file. */
  vfs: Vfs;
  /** Node resolution from this file, so a transform need not reimplement it. */
  resolve: (specifier: string) => string | undefined;
}
