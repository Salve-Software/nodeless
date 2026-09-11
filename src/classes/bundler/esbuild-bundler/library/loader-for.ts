import type { Loader } from 'esbuild-wasm';
import {
  DEFAULT_LOADER,
  LOADERS,
} from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { extname } from '@/library/index.js';

export function loaderFor(path: string): Loader {
  return LOADERS[extname(path)] ?? DEFAULT_LOADER;
}
