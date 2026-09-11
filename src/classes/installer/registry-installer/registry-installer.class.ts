import type { InstallScope, RegistryInstallerOptions } from './types/index.js';
import type { InstallOptions, InstallResult, Installer } from '@/types/index.js';
import { MemoryPackageCache } from '@/classes/installer/memory-package-cache/index.js';
import { LOCKFILE_PATH, REGISTRY_URL } from './constants/index.js';
import {
  buildLockfile,
  collectPeerWarnings,
  readRootDependencies,
  readWorkspaces,
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
      workspaces: new Map(),
    };
  }

  async install(options?: InstallOptions): Promise<InstallResult> {
    // Read every time: a workspace package can be written into the VFS between installs.
    this.scope.workspaces = readWorkspaces(this.scope.vfs);

    const roots = readRootDependencies(this.scope.vfs, options);
    const { installed, warnings } = await walkDependencies(this.scope, roots);
    const lockfile = buildLockfile(installed);

    this.scope.vfs.writeFile(LOCKFILE_PATH, `${JSON.stringify(lockfile, null, 2)}\n`);

    return {
      installed: Object.fromEntries(
        installed.map((entry) => [entry.name, entry.version]),
      ),
      warnings: [...warnings, ...collectPeerWarnings(installed)],
      lockfile,
    };
  }
}
