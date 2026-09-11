import type {
  Packument,
  PackumentVersion,
} from '@/classes/installer/registry-installer/types/index.js';
import { maxSatisfying } from 'semver';
import { InstallError } from '@/errors/index.js';

// `npm:`, `file:`, `git+https:` and friends. Supporting them would mean supporting
// something other than the registry, which this installer deliberately does not.
const NON_REGISTRY = /^[a-z+]+:/i;

/** A range picks the highest match; anything else is treated as a dist-tag. */
export function pickVersion(packument: Packument, range: string): PackumentVersion {
  if (NON_REGISTRY.test(range)) {
    throw new InstallError(
      `Only registry ranges are supported, and "${packument.name}" asks for "${range}"`,
      { name: packument.name, range },
    );
  }

  const versions = Object.keys(packument.versions);
  const wanted =
    maxSatisfying(versions, range === '' ? '*' : range) ??
    packument['dist-tags'][range === '' ? 'latest' : range];
  const resolved = wanted === undefined ? undefined : packument.versions[wanted];

  if (!resolved) {
    throw new InstallError(`No version of "${packument.name}" satisfies "${range}"`, {
      name: packument.name,
      range,
      available: versions.length,
    });
  }

  return resolved;
}
