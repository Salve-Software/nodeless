import type { PackumentVersion } from '@/classes/installer/registry-installer/types/index.js';

/** `peerDependenciesMeta` marks the peers a package works fine without. */
export function optionalPeers(version: PackumentVersion): Set<string> {
  const meta = Object.entries(version.peerDependenciesMeta ?? {});

  return new Set(
    meta.filter(([, value]) => value.optional === true).map(([name]) => name),
  );
}
