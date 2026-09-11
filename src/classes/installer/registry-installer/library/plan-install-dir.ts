import type { InstallRequest } from '@/classes/installer/registry-installer/types/index.js';
import { satisfies } from 'semver';
import { NODE_MODULES_DIR } from '@/classes/installer/registry-installer/constants/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { joinPath } from '@/library/index.js';

/**
 * Flat like npm: everything goes to the root `node_modules`. A version that clashes with
 * what is already there nests under its own dependent instead.
 */
export function planInstallDir(
  rootVersions: Map<string, string>,
  { request, version }: { request: InstallRequest; version: string },
): string | undefined {
  const claimed = rootVersions.get(request.name);

  if (claimed === undefined) {
    rootVersions.set(request.name, version);

    return joinPath(ROOT_PATH, `${NODE_MODULES_DIR}/${request.name}`);
  }

  // Already satisfied at the root: the dependency tree below it was walked too.
  if (satisfies(claimed, request.range === '' ? '*' : request.range)) return undefined;

  return joinPath(request.parentDir, `${NODE_MODULES_DIR}/${request.name}`);
}
