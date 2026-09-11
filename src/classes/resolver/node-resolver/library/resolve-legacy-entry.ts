import type {
  ResolveScope,
  PackageManifest,
} from '@/classes/resolver/node-resolver/types/index.js';

/** Package without `exports`: the `browser` string field, then `module`, then `main`. */
export function resolveLegacyEntry(
  scope: ResolveScope,
  manifest: PackageManifest,
): string[] {
  const entries: string[] = [];

  if (scope.conditions.includes('browser') && typeof manifest.browser === 'string') {
    entries.push(manifest.browser);
  }
  if (typeof manifest.module === 'string') entries.push(manifest.module);
  if (typeof manifest.main === 'string') entries.push(manifest.main);

  return entries;
}
