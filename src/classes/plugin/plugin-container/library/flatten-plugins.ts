import type { Plugin } from '@/types/index.js';
import { isPlugin } from './is-plugin.js';

/** A config's `plugins` is a nested array with holes in it — `[react(), cond && x, [a, b]]`. */
export function flattenPlugins(value: unknown): Plugin[] {
  if (Array.isArray(value)) return value.flatMap((entry) => flattenPlugins(entry));

  return isPlugin(value) ? [value] : [];
}
