import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { OnResolveArgs, OnResolveResult } from 'esbuild-wasm';
import {
  EMPTY_NAMESPACE,
  VFS_NAMESPACE,
} from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { cdnSpecifier } from './cdn-specifier.js';
import { isBareSpecifier } from './is-bare-specifier.js';
import { isExternalSpecifier } from './is-external-specifier.js';

/** Node resolution over the VFS. Synchronous, which is what keeps a warm build at ~200 ms. */
export function resolveInVfs(
  {
    resolver,
    external,
    warnings,
    cdn,
  }: Pick<VfsPluginOptions, 'resolver' | 'external' | 'warnings' | 'cdn'>,
  args: OnResolveArgs,
): OnResolveResult {
  if (isExternalSpecifier(args.path, external)) {
    return { path: args.path, external: true };
  }

  try {
    const result = resolver.resolve({ specifier: args.path, importer: args.importer });

    if (result.kind === 'file') return { path: result.path, namespace: VFS_NAMESPACE };
    if (result.kind === 'external') return { path: result.specifier, external: true };

    warnings.push({
      text: result.reason,
      ...(args.importer === '' ? {} : { file: args.importer }),
    });

    return { path: args.path, namespace: EMPTY_NAMESPACE };
  } catch (error) {
    // Nothing in the VFS matched. With a CDN configured that is not an error:
    // the package is fetched by the browser at runtime instead of being bundled.
    if (cdn && isBareSpecifier(args.path)) {
      return { path: cdnSpecifier(args.path, cdn), external: true };
    }

    return { errors: [{ text: error instanceof Error ? error.message : String(error) }] };
  }
}
