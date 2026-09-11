import type { Plugin } from '@/types/index.js';

/** Vite's order: `pre` first, then the unmarked ones, then `post`. */
export function orderPlugins(plugins: Plugin[]): Plugin[] {
  return [
    ...plugins.filter((plugin) => plugin.enforce === 'pre'),
    ...plugins.filter((plugin) => plugin.enforce === undefined),
    ...plugins.filter((plugin) => plugin.enforce === 'post'),
  ];
}
