import type { Loader } from 'esbuild-wasm';
import {
  DEFAULT_RUNTIME_LOADER,
  RUNTIME_LOADERS,
} from '@/classes/runtime/module-runtime/constants/index.js';
import { extname } from '@/library/index.js';

export function runtimeLoaderFor(path: string): Loader {
  return RUNTIME_LOADERS[extname(path)] ?? DEFAULT_RUNTIME_LOADER;
}
