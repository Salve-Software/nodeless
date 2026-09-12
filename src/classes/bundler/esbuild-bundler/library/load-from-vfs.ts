import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { OnLoadResult } from 'esbuild-wasm';
import { DEFAULT_ASSET_LIMIT } from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { dirname } from '@/library/index.js';
import { inlineOrEmit } from './inline-or-emit.js';
import { loaderFor } from './loader-for.js';
import { transformableText } from './transformable-text.js';

/** Reads one module for esbuild, after `load` and `transform` have had their turn. */
export async function loadFromVfs(
  {
    vfs,
    container,
    assetLimit = DEFAULT_ASSET_LIMIT,
  }: Pick<VfsPluginOptions, 'vfs' | 'container' | 'assetLimit'>,
  path: string,
): Promise<OnLoadResult> {
  const size = vfs.stat(path)?.size ?? 0;
  const loader = inlineOrEmit(loaderFor(path), { size, limit: assetLimit });
  const resolveDir = dirname(path);
  const loaded = await container?.load(path);
  const source = loaded?.code ?? transformableText(vfs, { path, loader });

  if (source === undefined) return { contents: vfs.readFile(path), loader, resolveDir };

  const transformed = await container?.transform(source, path);

  return {
    contents: transformed?.code ?? source,
    loader: transformed?.loader ?? loaded?.loader ?? loader,
    resolveDir,
  };
}
