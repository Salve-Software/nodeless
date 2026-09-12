import type { RuntimePluginOptions } from '@/classes/runtime/module-runtime/types/index.js';
import type { Plugin } from 'esbuild-wasm';
import {
  EMPTY_NAMESPACE,
  RUNTIME_NAMESPACE,
  SHIM_NAMESPACE,
} from '@/classes/runtime/module-runtime/constants/index.js';
import { createShimModule } from './create-shim-module.js';
import { loadRuntimeFile } from './load-runtime-file.js';

/**
 * Every `node:fs` in the config graph is rewritten to a shim here, before anything runs.
 * That is what makes the sandbox hold: the real builtin is never reachable, rather than
 * reachable and blocked.
 */
export function createRuntimePlugin({
  vfs,
  resolver,
  isShimmed,
}: RuntimePluginOptions): Plugin {
  return {
    name: 'nodeless-runtime',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (isShimmed(args.path)) {
          return { path: args.path.replace(/^node:/, ''), namespace: SHIM_NAMESPACE };
        }

        const result = resolver.resolve({
          specifier: args.path,
          importer: args.importer,
        });

        if (result.kind === 'file') {
          return { path: result.path, namespace: RUNTIME_NAMESPACE };
        }
        if (result.kind === 'external') {
          return { path: result.specifier, external: true };
        }

        return { path: args.path, namespace: EMPTY_NAMESPACE };
      });

      build.onLoad({ filter: /.*/, namespace: SHIM_NAMESPACE }, (args) => ({
        contents: createShimModule(args.path),
        loader: 'js' as const,
      }));

      build.onLoad({ filter: /.*/, namespace: RUNTIME_NAMESPACE }, (args) =>
        loadRuntimeFile(vfs, args.path),
      );

      build.onLoad({ filter: /.*/, namespace: EMPTY_NAMESPACE }, () => ({
        contents: 'module.exports = {};',
        loader: 'js' as const,
      }));
    },
  };
}
