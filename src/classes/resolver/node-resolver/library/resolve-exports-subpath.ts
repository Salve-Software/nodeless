import type {
  ResolveScope,
  PackageManifest,
} from '@/classes/resolver/node-resolver/types/index.js';
import { exports as resolveExportsField } from 'resolve.exports';

/**
 * An unexported subpath returns an empty list instead of throwing: whether that becomes
 * an error is up to `resolveSpecifier`, which still has other `node_modules` to try.
 */
export function resolveExportsSubpath(
  scope: ResolveScope,
  { manifest, subpath }: { manifest: PackageManifest; subpath: string },
): string[] {
  try {
    const resolved = resolveExportsField(
      { ...manifest, name: manifest.name ?? 'package' },
      subpath,
      {
        browser: scope.conditions.includes('browser'),
        require: false,
        conditions: scope.conditions,
      },
    );

    return resolved ? [...resolved] : [];
  } catch {
    return [];
  }
}
