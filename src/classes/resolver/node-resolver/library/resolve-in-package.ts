import type {
  ResolveScope,
  PackageManifest,
} from '@/classes/resolver/node-resolver/types/index.js';
import { joinPath } from '@/library/index.js';
import { loadAsDirectory } from './load-as-directory.js';
import { loadAsFile } from './load-as-file.js';
import { resolveExportsSubpath } from './resolve-exports-subpath.js';

/** A package with `exports` is sealed: what is not mapped does not exist, and never falls back to `main`. */
export function resolveInPackage(
  scope: ResolveScope,
  {
    packageDir,
    manifest,
    subpath,
  }: { packageDir: string; manifest: PackageManifest; subpath: string },
): string | undefined {
  if (manifest.exports !== undefined) {
    for (const target of resolveExportsSubpath(scope, { manifest, subpath })) {
      const path = loadAsFile(scope, joinPath(packageDir, target));

      if (path) return path;
    }

    return undefined;
  }

  if (subpath === '.') return loadAsDirectory(scope, packageDir);

  const target = joinPath(packageDir, subpath);

  return loadAsFile(scope, target) ?? loadAsDirectory(scope, target);
}
