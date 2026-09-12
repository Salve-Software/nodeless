import type { Vfs } from '@/types/index.js';
import { basename, dirname, joinPath } from '@/library/index.js';
import { SASS_EXTENSIONS } from '@/plugins/sass-plugin/constants/index.js';

/** A Sass partial is written `@use './mixins'` and stored as `_mixins.scss`. */
export function locateStylesheet(vfs: Vfs, target: string): string | undefined {
  const dir = dirname(target);
  const name = basename(target);
  const candidates = [target];

  for (const extension of SASS_EXTENSIONS) {
    candidates.push(`${target}${extension}`, joinPath(dir, `_${name}${extension}`));
  }
  candidates.push(`${target}.css`);

  return candidates.find((candidate) => vfs.stat(candidate)?.type === 'file');
}
