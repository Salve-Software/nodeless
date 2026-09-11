import type {
  BrowserMapping,
  PackageScope,
  ResolveScope,
} from '@/classes/resolver/node-resolver/types/index.js';
import { browserMap } from './browser-map.js';

/** A bare key in the `browser` field — the `"fs": false` you find in published libraries. */
export function applyBrowserAlias(
  scope: ResolveScope,
  { owner, specifier }: { owner: PackageScope; specifier: string },
): BrowserMapping | undefined {
  const map = browserMap(scope, owner.manifest);
  const value = map?.[specifier];

  if (value === undefined) return undefined;

  return value === false ? { kind: 'empty' } : { kind: 'redirect', specifier: value };
}
