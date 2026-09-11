import type { OnLoadResult } from 'esbuild-wasm';
import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import { CSS_LOADERS } from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { dirname } from '@/library/index.js';
import { loaderFor } from './loader-for.js';

/** Reads one file for esbuild, giving a `cssTransform` its shot at any stylesheet. */
export async function loadFromVfs(
  { vfs, cssTransform }: Pick<VfsPluginOptions, 'vfs' | 'cssTransform'>,
  path: string,
): Promise<OnLoadResult> {
  const loader = loaderFor(path);
  const resolveDir = dirname(path);

  if (cssTransform && CSS_LOADERS.has(loader)) {
    return {
      contents: await cssTransform({ path, css: vfs.readText(path), vfs }),
      loader,
      resolveDir,
    };
  }

  return { contents: vfs.readFile(path), loader, resolveDir };
}
