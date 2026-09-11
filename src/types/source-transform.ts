import type { TransformInput } from './transform-input.js';
import type { TransformResult } from './transform-result.js';

/**
 * Turns a file into something esbuild understands. Sass, Tailwind and anything else a
 * project's toolchain would have done are all this same shape.
 */
export interface SourceTransform {
  name: string;
  matches(file: { path: string; content: string }): boolean;
  apply(file: TransformInput): Promise<TransformResult>;
}
