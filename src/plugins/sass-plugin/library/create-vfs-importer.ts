import type { SassImporter } from '@/plugins/sass-plugin/types/index.js';
import type { PluginContext } from '@/types/index.js';
import { extname, normalizePath } from '@/library/index.js';
import { VFS_SCHEME } from '@/plugins/sass-plugin/constants/index.js';
import { locateStylesheet } from './locate-stylesheet.js';

/** Answers Sass's `@use` and `@import` out of the VFS instead of a filesystem. */
export function createVfsImporter(
  { vfs, resolve }: PluginContext,
  from: string,
): SassImporter {
  return {
    canonicalize: (url) => {
      // Sass has already resolved a relative load against the containing URL by now.
      const found = url.startsWith(VFS_SCHEME)
        ? locateStylesheet(vfs, normalizePath(url.slice(VFS_SCHEME.length)))
        : resolve(url, from);

      return found === undefined ? null : new URL(`${VFS_SCHEME}${found}`);
    },
    load: (url) => {
      const found = url.href.slice(VFS_SCHEME.length);

      return {
        contents: vfs.readText(found),
        syntax: extname(found) === '.sass' ? 'indented' : 'scss',
      };
    },
  };
}
