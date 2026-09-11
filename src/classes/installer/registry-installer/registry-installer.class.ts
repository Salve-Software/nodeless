import type { InstallScope, RegistryInstallerOptions } from './types/index.js';
import type { InstallResult, Installer } from '@/types/index.js';
import { MemoryPackageCache } from '@/classes/installer/memory-package-cache/index.js';
import { LOCKFILE_PATH, REGISTRY_URL } from './constants/index.js';
import {
  buildLockfile,
  collectPeerWarnings,
  readRootDependencies,
  walkDependencies,
} from './library/index.js';

/** npm without npm: packument, semver, tarball. No lifecycle script ever runs. */
export class RegistryInstaller implements Installer {
  private readonly scope: InstallScope;

  constructor({
    vfs,
    registryUrl = REGISTRY_URL,
    cache = new MemoryPackageCache(),
    fetch: fetchImpl,
  }: RegistryInstallerOptions) {
    this.scope = {
      vfs,
      registryUrl: registryUrl.replace(/\/+$/, ''),
      fetch: fetchImpl ?? globalThis.fetch.bind(globalThis),
      cache,
      packuments: new Map(),
      downloads: new Map(),
    };
  }

  async install(): Promise<InstallResult> {
    const installed = await walkDependencies(
      this.scope,
      readRootDependencies(this.scope.vfs),
    );
    const lockfile = buildLockfile(installed);

    this.scope.vfs.writeFile(LOCKFILE_PATH, `${JSON.stringify(lockfile, null, 2)}\n`);

    return {
      installed: Object.fromEntries(
        installed.map((entry) => [entry.name, entry.version]),
      ),
      warnings: collectPeerWarnings(installed),
      lockfile,
    };
  }
}
