import type { TailwindPluginOptions } from './types/index.js';
import type { Plugin } from '@/types/index.js';
import { dirname, joinPath } from '@/library/index.js';
import { TAILWIND_MARKERS } from './constants/index.js';
import {
  collectCandidates,
  loadTailwind,
  readStylesheet,
  refuseModule,
} from './library/index.js';

/**
 * Compiles a stylesheet that uses Tailwind directives. Plain CSS never reaches it, and a
 * config that brings `@tailwindcss/vite` leaves nothing for it to claim.
 */
export function tailwindPlugin({ tailwind }: TailwindPluginOptions = {}): Plugin {
  return {
    name: 'nodeless:tailwind',
    enforce: 'post',
    async transform(code, id) {
      if (!TAILWIND_MARKERS.test(code)) return null;

      const api = tailwind ?? (await loadTailwind());
      const compiler = await api.compile(code, {
        base: dirname(id),
        loadStylesheet: async (specifier, base) =>
          readStylesheet(this.vfs, {
            id: specifier,
            from: id,
            found: specifier.startsWith('.')
              ? joinPath(base, specifier)
              : this.resolve(specifier, id),
          }),
        loadModule: async (specifier) => refuseModule(specifier),
      });

      return { code: compiler.build(collectCandidates(this.vfs)), loader: 'css' };
    },
  };
}
