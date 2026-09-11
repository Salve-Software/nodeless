import type { Loader } from 'esbuild-wasm';
import {
  CSS_MODULE_LOADER,
  CSS_MODULE_SUFFIX,
  DEFAULT_LOADER,
  LOADERS,
} from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { basename, extname } from '@/library/index.js';

export function loaderFor(path: string): Loader {
  if (basename(path).endsWith(CSS_MODULE_SUFFIX)) return CSS_MODULE_LOADER;

  return LOADERS[extname(path)] ?? DEFAULT_LOADER;
}
