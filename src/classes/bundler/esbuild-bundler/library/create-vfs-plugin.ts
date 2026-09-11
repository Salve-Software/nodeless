import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { Plugin } from 'esbuild-wasm';
import {
  EMPTY_NAMESPACE,
  VFS_NAMESPACE,
} from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { dirname } from '@/library/index.js';
import { isExternalSpecifier } from './is-external-specifier.js';
import { loaderFor } from './loader-for.js';

/** esbuild-wasm has no filesystem: every resolution and every read goes through here. */
export function createVfsPlugin({
  vfs,
  resolver,
  external,
  warnings,
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
          return {
            errors: [{ text: error instanceof Error ? error.message : String(error) }],
          };
        }
      });

      build.onLoad({ filter: /.*/, namespace: VFS_NAMESPACE }, (args) => ({
        contents: vfs.readFile(args.path),
        loader: loaderFor(args.path),
        resolveDir: dirname(args.path),
      }));

      build.onLoad({ filter: /.*/, namespace: EMPTY_NAMESPACE }, () => ({
        contents: 'export default {};',
        loader: 'js' as const,
      }));
    },
  };
}
