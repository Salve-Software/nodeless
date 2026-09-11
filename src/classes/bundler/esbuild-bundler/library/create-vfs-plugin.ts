import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { Plugin } from 'esbuild-wasm';
import {
  EMPTY_NAMESPACE,
  VFS_NAMESPACE,
} from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { cdnSpecifier } from './cdn-specifier.js';
import { isBareSpecifier } from './is-bare-specifier.js';
import { isExternalSpecifier } from './is-external-specifier.js';
import { loadFromVfs } from './load-from-vfs.js';

/** esbuild-wasm has no filesystem: every resolution and every read goes through here. */
export function createVfsPlugin({
  vfs,
  resolver,
  external,
  warnings,
  cssTransform,
  cdn,
}: VfsPluginOptions): Plugin {
  return {
    name: 'nodeless-vfs',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (isExternalSpecifier(args.path, external)) {
          return { path: args.path, external: true };
        }

        try {
          const result = resolver.resolve({
            specifier: args.path,
            importer: args.importer,
          });

          if (result.kind === 'file') {
            return { path: result.path, namespace: VFS_NAMESPACE };
          }
          if (result.kind === 'external') {
            return { path: result.specifier, external: true };
          }

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

          return {
            errors: [{ text: error instanceof Error ? error.message : String(error) }],
          };
        }
      });

      build.onLoad({ filter: /.*/, namespace: VFS_NAMESPACE }, async (args) =>
        loadFromVfs({ vfs, ...(cssTransform ? { cssTransform } : {}) }, args.path),
      );

      build.onLoad({ filter: /.*/, namespace: EMPTY_NAMESPACE }, () => ({
        contents: 'export default {};',
        loader: 'js' as const,
      }));
    },
  };
}
