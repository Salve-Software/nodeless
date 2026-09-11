import type {
  InstallRequest,
  InstallScope,
  InstalledPackage,
  ResolvedPackage,
} from '@/classes/installer/registry-installer/types/index.js';
import { dependenciesOf } from './dependencies-of.js';
import { downloadPackage } from './download-package.js';
import { fetchPackument } from './fetch-packument.js';
import { optionalPeers } from './optional-peers.js';
import { pickVersion } from './pick-version.js';
import { planInstallDir } from './plan-install-dir.js';
import { writePackage } from './write-package.js';

/**
 * Breadth-first, one level per round trip: every package in a level is fetched in parallel,
 * then placed. Placement is synchronous so two dependents cannot both claim the root.
 */
export async function walkDependencies(
  scope: InstallScope,
  roots: InstallRequest[],
): Promise<InstalledPackage[]> {
  const rootVersions = new Map<string, string>();
  const installed: InstalledPackage[] = [];
  const written = new Set<string>();
  let pending = roots;

  while (pending.length > 0) {
    const level = dedupe(pending);

    pending = [];

    const resolved = await Promise.all(level.map((request) => resolve(scope, request)));

    for (const item of resolved) {
      const dir = planInstallDir(rootVersions, {
        request: item.request,
        version: item.version.version,
      });

      if (dir === undefined || written.has(dir)) continue;

      written.add(dir);
      writePackage(scope.vfs, { dir, files: item.files });
      installed.push({
        name: item.request.name,
        version: item.version.version,
        dir,
        resolved: item.tarball,
        ...(item.version.dist.integrity === undefined
          ? {}
          : { integrity: item.version.dist.integrity }),
        peerDependencies: item.version.peerDependencies ?? {},
        optionalPeers: optionalPeers(item.version),
      });
      pending.push(...dependenciesOf(item.version, dir));
    }
  }

  return installed;
}

async function resolve(
  scope: InstallScope,
  request: InstallRequest,
): Promise<ResolvedPackage> {
  const packument = await fetchPackument(scope, request.name);
  const version = pickVersion(packument, request.range);
  const files = await downloadPackage(scope, { name: request.name, version });

  return { request, version, tarball: version.dist.tarball, files };
}

function dedupe(requests: InstallRequest[]): InstallRequest[] {
  const seen = new Map<string, InstallRequest>();

  for (const request of requests) {
    seen.set(`${request.name}@${request.range}@${request.parentDir}`, request);
  }

  return [...seen.values()];
}
