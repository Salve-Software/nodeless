import type { ResolveScope } from '@/classes/resolver/node-resolver/types/index.js';
import { joinPath } from '@/library/index.js';
import { loadAsFile } from './load-as-file.js';
import { resolveLegacyEntry } from './resolve-legacy-entry.js';

export function loadAsDirectory(scope: ResolveScope, dir: string): string | undefined {
  const manifest = scope.readManifest(dir);

  for (const entry of manifest ? resolveLegacyEntry(scope, manifest) : []) {
    const target = joinPath(dir, entry);
    const path =
      loadAsFile(scope, target) ?? loadAsFile(scope, joinPath(target, 'index'));

    if (path) return path;
  }

  return loadAsFile(scope, joinPath(dir, 'index'));
}
