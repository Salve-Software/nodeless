import type { Vfs } from '@/types/index.js';
import type { OnLoadResult } from 'esbuild-wasm';
import { injectModuleGlobals } from './inject-module-globals.js';
import { replaceImportMetaUrl } from './replace-import-meta-url.js';
import { runtimeLoaderFor } from './runtime-loader-for.js';

/** Reads one file of the config graph, with the two module globals an iife cannot provide. */
export function loadRuntimeFile(vfs: Vfs, path: string): OnLoadResult {
  const loader = runtimeLoaderFor(path);

  if (loader === 'json' || loader === 'empty') {
    return { contents: vfs.readText(path), loader };
  }

  const source = replaceImportMetaUrl(vfs.readText(path), path);

  return { contents: injectModuleGlobals(source, path), loader };
}
