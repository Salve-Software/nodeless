import type { PathMapping } from '@/classes/resolver/node-resolver/types/index.js';
import type { Vfs } from '@/types/index.js';
import { TSCONFIG_PATH } from '@/classes/resolver/node-resolver/constants/index.js';
import { joinPath } from '@/library/index.js';
import { stripJsonComments } from './strip-json-comments.js';

/**
 * `compilerOptions.paths`, which every shadcn/ui project uses as `@/*`. `extends` is not
 * followed: the base config is rarely in the VFS, and guessing would be worse than not trying.
 */
export function readTsconfigPaths(vfs: Vfs): PathMapping[] {
  const options = parse(vfs)?.compilerOptions;
  const declared = options?.paths;

  if (!declared) return [];

  const base = joinPath('/', options?.baseUrl ?? '.');
  const mappings: PathMapping[] = [];

  for (const [pattern, targets] of Object.entries(declared)) {
    if (!Array.isArray(targets)) continue;

    const star = pattern.indexOf('*');
    const resolved = targets
      .filter((target): target is string => typeof target === 'string')
      .map((target) => joinPath(base, target.replace('*', '')));

    mappings.push({
      prefix: star === -1 ? pattern : pattern.slice(0, star),
      suffix: star === -1 ? '' : pattern.slice(star + 1),
      targets: resolved,
    });
  }

  // Longest prefix wins, which is what TypeScript does when two patterns both match.
  return mappings.sort((a, b) => b.prefix.length - a.prefix.length);
}

function parse(
  vfs: Vfs,
):
  | { compilerOptions?: { baseUrl?: string; paths?: Record<string, unknown> } }
  | undefined {
  const bytes = vfs.tryReadFile(TSCONFIG_PATH);

  if (!bytes) return undefined;

  try {
    return JSON.parse(stripJsonComments(vfs.readText(TSCONFIG_PATH))) as {
      compilerOptions?: { baseUrl?: string };
    };
  } catch {
    return undefined;
  }
}
