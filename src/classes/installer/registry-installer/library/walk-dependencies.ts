import type {
  InstallProgress,
  InstallRequest,
  InstallScope,
  InstalledPackage,
  ResolveOutcome,
  ResolvedPackage,
} from '@/classes/installer/registry-installer/types/index.js';
import { dependenciesOf } from './dependencies-of.js';
import { downloadPackage } from './download-package.js';
import { fetchPackument } from './fetch-packument.js';
import { optionalPeers } from './optional-peers.js';
import { pickVersion } from './pick-version.js';
import { planInstallDir } from './plan-install-dir.js';
import { readPackageTree } from './read-package-tree.js';
import { writePackage } from './write-package.js';

/** Breadth first, one round trip per level. Placement is sync so dependents cannot race. */
export async function walkDependencies(
  scope: InstallScope,
  roots: InstallRequest[],
): Promise<InstallProgress> {
  const rootVersions = new Map<string, string>();
  const installed: InstalledPackage[] = [];
  const warnings: string[] = [];
  const written = new Set<string>();
  let pending = roots;

  while (pending.length > 0) {
    const level = dedupe(pending);

    pending = [];

    const resolved = await Promise.all(level.map((request) => resolve(scope, request)));

    for (const outcome of resolved) {
      if (!outcome.ok) {
        warnings.push(outcome.warning);
        continue;
      }

      const item = outcome.package;
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

  return { installed, warnings };
}

/**
 * One unresolvable package used to abort the whole install. It becomes a warning instead,
 * and the build decides whether it was ever needed.
 */
async function resolve(
  scope: InstallScope,
  request: InstallRequest,
): Promise<ResolveOutcome> {
  const local = fromWorkspace(scope, request);

  if (local) return { ok: true, package: local };

  try {
    const packument = await fetchPackument(scope, request.name);
    const version = pickVersion(packument, request.range);
    const files = await downloadPackage(scope, { name: request.name, version });

    return {
      ok: true,
      package: { request, version, tarball: version.dist.tarball, files },
    };
  } catch (error) {
    return {
      ok: false,
      warning: `Skipped ${request.name}@${request.range}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/** A workspace package is already in the VFS; going to the registry for it would 404. */
function fromWorkspace(
  scope: InstallScope,
  request: InstallRequest,
): ResolvedPackage | undefined {
  const dir = scope.workspaces.get(request.name);

  if (dir === undefined) return undefined;

  const files = readPackageTree(scope.vfs, dir);
  const manifest = parseManifest(files);

  return {
    request,
    version: {
      version: manifest.version ?? '0.0.0',
      ...(manifest.dependencies ? { dependencies: manifest.dependencies } : {}),
      dist: { tarball: `workspace:${dir}` },
    },
    tarball: `workspace:${dir}`,
    files,
  };
}

function parseManifest(files: Record<string, Uint8Array>): {
  version?: string;
  dependencies?: Record<string, string>;
} {
  const bytes = files['package.json'];

  if (!bytes) return {};

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as { version?: string };
  } catch {
    return {};
  }
}

function dedupe(requests: InstallRequest[]): InstallRequest[] {
  const seen = new Map<string, InstallRequest>();

  for (const request of requests) {
    seen.set(`${request.name}@${request.range}@${request.parentDir}`, request);
  }

  return [...seen.values()];
}
