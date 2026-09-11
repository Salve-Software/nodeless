import type {
  ResolveScope,
  PackageManifest,
} from '@/classes/resolver/node-resolver/types/index.js';

/** The `browser` field in map form only. The string form is an entry point, not an override. */
export function browserMap(
  scope: ResolveScope,
  manifest: PackageManifest,
): Record<string, string | false> | undefined {
  const field = manifest.browser;

  if (!scope.conditions.includes('browser')) return undefined;

  return typeof field === 'object' && field !== null ? field : undefined;
}
