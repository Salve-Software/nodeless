import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { OnLoadResult } from 'esbuild-wasm';
import { CSS_LOADERS } from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { dirname } from '@/library/index.js';
import { inlineOrEmit } from './inline-or-emit.js';
import { loaderFor } from './loader-for.js';

/** Reads one file for esbuild, giving a `cssTransform` its shot at any stylesheet. */
export async function loadFromVfs(
  {
    vfs,
    cssTransform,
    assetLimit = 0,
  }: Pick<VfsPluginOptions, 'vfs' | 'cssTransform' | 'assetLimit'>,
  path: string,
): Promise<OnLoadResult> {
  const size = vfs.stat(path)?.size ?? 0;
  const loader = inlineOrEmit(loaderFor(path), { size, limit: assetLimit });
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
