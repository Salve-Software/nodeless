import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { OnLoadResult } from 'esbuild-wasm';
import { DEFAULT_ASSET_LIMIT } from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { applyTransforms } from '@/classes/transform/library/index.js';
import { dirname } from '@/library/index.js';
import { inlineOrEmit } from './inline-or-emit.js';
import { loaderFor } from './loader-for.js';
import { transformableText } from './transformable-text.js';

/** Reads one file for esbuild, after whichever transform claims it has had its turn. */
export async function loadFromVfs(
  {
    vfs,
    resolver,
    transforms = [],
    assetLimit = DEFAULT_ASSET_LIMIT,
  }: Pick<VfsPluginOptions, 'vfs' | 'resolver' | 'transforms' | 'assetLimit'>,
  path: string,
): Promise<OnLoadResult> {
  const size = vfs.stat(path)?.size ?? 0;
  const loader = inlineOrEmit(loaderFor(path), { size, limit: assetLimit });
  const resolveDir = dirname(path);
  const content = transformableText(vfs, { path, loader });

  if (content !== undefined) {
    const transformed = await applyTransforms(transforms, {
      path,
      content,
      vfs,
      resolve: (specifier) => resolveFrom(resolver, { specifier, importer: path }),
    });

    if (transformed) {
      return {
        contents: transformed.content,
        loader: transformed.loader ?? loader,
        resolveDir,
      };
    }
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
