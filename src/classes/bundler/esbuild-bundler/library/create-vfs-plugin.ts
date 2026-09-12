import type { VfsPluginOptions } from '@/classes/bundler/esbuild-bundler/types/index.js';
import type { Plugin } from 'esbuild-wasm';
import {
  EMPTY_NAMESPACE,
  VFS_NAMESPACE,
} from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { loadFromVfs } from './load-from-vfs.js';
import { resolveInVfs } from './resolve-in-vfs.js';

/** esbuild-wasm has no filesystem: every resolution and every read goes through here. */
export function createVfsPlugin({
  vfs,
  resolver,
  external,
  warnings,
  container,
  cdn,
  assetLimit,
}: VfsPluginOptions): Plugin {
  const scope = { resolver, external, warnings, ...(cdn === undefined ? {} : { cdn }) };

  return {
    name: 'nodeless-vfs',
    setup(build) {
      // Two registrations, and the difference is the point: resolution runs thousands of
      // times per build, and an async handler costs a microtask on every one of them. Only
      // a plugin that actually implements `resolveId` is worth paying that for.
      if (container?.resolvesIds()) {
        build.onResolve({ filter: /.*/ }, async (args) => {
          const claimed = await container.resolveId(args.path, args.importer);

          if (!claimed) return resolveInVfs(scope, args);

          return claimed.external
            ? { path: claimed.id, external: true }
            : { path: claimed.id, namespace: VFS_NAMESPACE };
        });
      } else {
        build.onResolve({ filter: /.*/ }, (args) => resolveInVfs(scope, args));
      }

      build.onLoad({ filter: /.*/, namespace: VFS_NAMESPACE }, async (args) =>
        loadFromVfs(
          {
            vfs,
            ...(container ? { container } : {}),
            ...(assetLimit === undefined ? {} : { assetLimit }),
          },
          args.path,
        ),
      );

      build.onLoad({ filter: /.*/, namespace: EMPTY_NAMESPACE }, () => ({
        contents: 'export default {};',
        loader: 'js' as const,
      }));
    },
  };
}
