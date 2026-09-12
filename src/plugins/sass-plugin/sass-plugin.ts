import type { SassPluginOptions } from './types/index.js';
import type { Plugin } from '@/types/index.js';
import { extname } from '@/library/index.js';
import { SASS_EXTENSIONS, VFS_SCHEME } from './constants/index.js';
import { createVfsImporter, loadSass } from './library/index.js';

/** Compiles `.scss` and `.sass` to CSS, the way Vite's own core does rather than a plugin. */
export function sassPlugin({ sass }: SassPluginOptions = {}): Plugin {
  return {
    name: 'nodeless:sass',
    enforce: 'post',
    async transform(code, id) {
      if (!SASS_EXTENSIONS.has(extname(id))) return null;

      const api = sass ?? (await loadSass());
      const importer = createVfsImporter(this, id);
      const { css } = api.compileString(code, {
        syntax: extname(id) === '.sass' ? 'indented' : 'scss',
        url: new URL(`${VFS_SCHEME}${id}`),
        importer,
        importers: [importer],
      });

      return { code: css, loader: 'css' };
    },
  };
}
