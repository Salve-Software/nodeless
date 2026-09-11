import type { SassImporter } from '@/classes/transform/sass-transform/types/index.js';
import type { TransformInput, Vfs } from '@/types/index.js';
import {
  SASS_EXTENSIONS,
  VFS_SCHEME,
} from '@/classes/transform/sass-transform/constants/index.js';
import { basename, dirname, extname, joinPath, normalizePath } from '@/library/index.js';

/** Answers Sass's `@use` and `@import` out of the VFS instead of a filesystem. */
export function createVfsImporter({ vfs, resolve }: TransformInput): SassImporter {
  return {
    canonicalize(url) {
      // Sass has already resolved a relative load against the containing URL by now.
      const found = url.startsWith(VFS_SCHEME)
        ? locate(vfs, normalizePath(url.slice(VFS_SCHEME.length)))
        : resolve(url);

      return found === undefined ? null : new URL(`${VFS_SCHEME}${found}`);
    },
    load(url) {
      const found = url.href.slice(VFS_SCHEME.length);

      return {
        contents: vfs.readText(found),
        syntax: extname(found) === '.sass' ? 'indented' : 'scss',
      };
    },
  };
}

/** A Sass partial is written `@use './mixins'` and stored as `_mixins.scss`. */
function locate(vfs: Vfs, target: string): string | undefined {
  const dir = dirname(target);
  const name = basename(target);
  const candidates = [target];

  for (const extension of SASS_EXTENSIONS) {
    candidates.push(`${target}${extension}`, joinPath(dir, `_${name}${extension}`));
  }
  candidates.push(`${target}.css`);

  return candidates.find((candidate) => vfs.stat(candidate)?.type === 'file');
}
