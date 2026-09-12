import type { ResolveScope } from '@/classes/resolver/node-resolver/types/index.js';
import { joinPath } from '@/library/index.js';
import { loadAsDirectory } from './load-as-directory.js';
import { loadAsFile } from './load-as-file.js';

/** `@/lib/util` becomes `/src/lib/util` when the tsconfig maps `@/*` to `src/*`. */
export function resolveTsconfigPath(
  scope: ResolveScope,
  specifier: string,
): string | undefined {
  for (const { prefix, suffix, targets } of scope.paths) {
    if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) continue;

    const matched = specifier.slice(prefix.length, specifier.length - suffix.length);

    for (const target of targets) {
      const candidate = joinPath(target, matched);
      const path = loadAsFile(scope, candidate) ?? loadAsDirectory(scope, candidate);

      if (path !== undefined) return path;
    }
  }

  return undefined;
}
