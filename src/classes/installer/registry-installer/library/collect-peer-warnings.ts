import type { InstalledPackage } from '@/classes/installer/registry-installer/types/index.js';
import { satisfies } from 'semver';

/**
 * Peer dependencies are reported, never installed. An optional peer is not reported
 * either — `@types/react` is optional on every Radix package, and warning about it
 * would bury the peers that actually matter.
 */
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
