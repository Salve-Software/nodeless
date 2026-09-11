import type { Vfs } from '@/types/index.js';
import type { Loader } from 'esbuild-wasm';
import { TRANSFORMABLE_LOADERS } from '@/classes/bundler/esbuild-bundler/constants/index.js';

/** Only text a transform could act on is decoded. An image is never handed to one. */
export function transformableText(
  vfs: Vfs,
  { path, loader }: { path: string; loader: Loader },
): string | undefined {
  return TRANSFORMABLE_LOADERS.has(loader) ? vfs.readText(path) : undefined;
}
