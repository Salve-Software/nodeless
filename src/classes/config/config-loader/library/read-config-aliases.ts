import type { AliasEntry } from '@/types/index.js';
import { normalizePath } from '@/library/index.js';

/** `resolve.alias` is an object or an array of `{ find, replacement }`; both are in the wild. */
export function readConfigAliases(config: Record<string, unknown>): AliasEntry[] {
  const resolve = config['resolve'];
  const declared = (resolve as { alias?: unknown } | undefined)?.alias;

  if (Array.isArray(declared)) {
    return (declared as Partial<AliasEntry>[])
      .filter(
        (entry): entry is AliasEntry =>
          typeof entry?.find === 'string' && typeof entry.replacement === 'string',
      )
      .map((entry) => ({
        find: entry.find,
        replacement: normalizePath(entry.replacement),
      }));
  }

  if (typeof declared !== 'object' || declared === null) return [];

  return Object.entries(declared)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([find, replacement]) => ({ find, replacement: normalizePath(replacement) }));
}
