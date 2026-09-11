import type { InstalledPackage } from '@/classes/installer/registry-installer/types/index.js';
import { satisfies } from 'semver';

/** Reported, never installed. A peer the package marks optional is not even reported. */
export function collectPeerWarnings(installed: InstalledPackage[]): string[] {
  const versions = new Map(installed.map((entry) => [entry.name, entry.version]));
  const warnings: string[] = [];

  for (const entry of installed) {
    for (const [name, range] of Object.entries(entry.peerDependencies)) {
      if (entry.optionalPeers.has(name)) continue;

      const present = versions.get(name);

      if (present !== undefined && satisfies(present, range)) continue;

      warnings.push(
        `${entry.name}@${entry.version} wants peer ${name}@${range}, ${
          present === undefined ? 'which is not installed' : `but ${present} is installed`
        }`,
      );
    }
  }

  return warnings;
}
