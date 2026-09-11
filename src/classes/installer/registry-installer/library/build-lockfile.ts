import type { InstalledPackage } from '@/classes/installer/registry-installer/types/index.js';
import type { Lockfile } from '@/types/index.js';
import { LOCKFILE_VERSION } from '@/classes/installer/registry-installer/constants/index.js';

/** Keyed by install directory, not by name: a nested copy is a different entry. */
export function buildLockfile(installed: InstalledPackage[]): Lockfile {
  const packages: Lockfile['packages'] = {};

  for (const entry of [...installed].sort((a, b) => a.dir.localeCompare(b.dir))) {
    packages[entry.dir.slice(1)] = {
      version: entry.version,
      resolved: entry.resolved,
      ...(entry.integrity === undefined ? {} : { integrity: entry.integrity }),
    };
  }

  return { lockfileVersion: LOCKFILE_VERSION, packages };
}
