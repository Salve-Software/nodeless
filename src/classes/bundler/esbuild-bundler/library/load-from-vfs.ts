import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { OnLoadResult } from 'esbuild-wasm';
import {
  CSS_LOADERS,
  DEFAULT_ASSET_LIMIT,
} from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { dirname } from '@/library/index.js';
import { inlineOrEmit } from './inline-or-emit.js';
import { loaderFor } from './loader-for.js';

/** Reads one file for esbuild, giving a `cssTransform` its shot at any stylesheet. */
export async function loadFromVfs(
  {
    vfs,
    resolver,
    cssTransform,
    assetLimit = DEFAULT_ASSET_LIMIT,
  }: Pick<VfsPluginOptions, 'vfs' | 'resolver' | 'cssTransform' | 'assetLimit'>,
  path: string,
): Promise<OnLoadResult> {
  const size = vfs.stat(path)?.size ?? 0;
  const loader = inlineOrEmit(loaderFor(path), { size, limit: assetLimit });
  const resolveDir = dirname(path);

  if (cssTransform && CSS_LOADERS.has(loader)) {
    return {
      contents: await cssTransform({
        path,
        css: vfs.readText(path),
        vfs,
        resolve: (specifier) => resolveFrom(resolver, { specifier, importer: path }),
      }),
      loader,
      resolveDir,
    };
  }

  return { contents: vfs.readFile(path), loader, resolveDir };
}

/** A transform asking about something that does not exist gets undefined, not a throw. */
function resolveFrom(
  resolver: VfsPluginOptions['resolver'],
  request: { specifier: string; importer: string },
): string | undefined {
  try {
    const result = resolver.resolve(request);

    return result.kind === 'file' ? result.path : undefined;
  } catch {
    return undefined;
  }
}
