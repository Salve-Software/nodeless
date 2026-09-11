import type {
  BrowserMapping,
  PackageScope,
  ResolveScope,
} from '@/classes/resolver/node-resolver/types/index.js';
import { joinPath } from '@/library/index.js';
import { browserMap } from './browser-map.js';
import { loadAsFile } from './load-as-file.js';

/** A relative key in the `browser` field, matched against the already resolved file. */
export function applyBrowserRedirect(
  scope: ResolveScope,
  { owner, path }: { owner: PackageScope; path: string },
): BrowserMapping | undefined {
  const map = browserMap(scope, owner.manifest);

  if (!map) return undefined;

  for (const [key, value] of Object.entries(map)) {
    if (!key.startsWith('.')) continue;

    const target = joinPath(owner.dir, key);

    if ((loadAsFile(scope, target) ?? target) !== path) continue;

    return value === false ? { kind: 'empty' } : { kind: 'redirect', specifier: value };
  }

  return undefined;
}
