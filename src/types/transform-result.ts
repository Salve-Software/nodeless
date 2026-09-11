import type { TransformLoader } from './transform-loader.js';

export interface TransformResult {
  content: string;
  /** Defaults to whatever the original extension implied, which is what a CSS to CSS pass wants. */
  loader?: TransformLoader;
}
