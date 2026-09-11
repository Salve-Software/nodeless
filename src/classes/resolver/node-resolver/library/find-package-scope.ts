import type {
  PackageScope,
  ResolveScope,
} from '@/classes/resolver/node-resolver/types/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { dirname, normalizePath } from '@/library/index.js';

/** The `package.json` that governs a directory: the nearest one walking up to the root. */
export function findPackageScope(
  scope: ResolveScope,
  fromDir: string,
): PackageScope | undefined {
  let current = normalizePath(fromDir);

  for (;;) {
    const manifest = scope.readManifest(current);

    if (manifest) return { dir: current, manifest };
    if (current === ROOT_PATH) return undefined;
    current = dirname(current);
  }
}
