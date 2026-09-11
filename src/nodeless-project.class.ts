import type {
  BuildOptions,
  BuildResult,
  Bundler,
  Disposer,
  InstallOptions,
  InstallResult,
  Installer,
  NodelessProjectOptions,
  Vfs,
  VfsSnapshot,
  VfsWatchEvent,
  VfsWatchListener,
  WatchOptions,
} from '@/types/index.js';
import { EsbuildBundler } from '@/classes/bundler/index.js';
import { RegistryInstaller } from '@/classes/installer/index.js';
import { NodeResolver } from '@/classes/resolver/index.js';
import { SassTransform, TailwindTransform } from '@/classes/transform/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { DEFAULT_CONDITIONS, DEFAULT_DEBOUNCE_MS } from '@/constants/index.js';

/** The library surface: a VFS, a build, and a snapshot to move between front end and API. */
export class NodelessProject {
  readonly vfs: Vfs;
  private readonly bundler: Bundler;
  private readonly installer: Installer;

  constructor({
    files,
    snapshot,
    vfs,
    bundler,
    installer,
    conditions = DEFAULT_CONDITIONS,
    wasmURL,
    esbuild,
    transforms = [],
    registryUrl,
    packageCache,
    fetch: fetchImpl,
  }: NodelessProjectOptions = {}) {
    this.vfs =
      vfs ??
      new MemoryVfs({ ...(files ? { files } : {}), ...(snapshot ? { snapshot } : {}) });
    this.bundler =
      bundler ??
      new EsbuildBundler({
        vfs: this.vfs,
        resolver: new NodeResolver({ vfs: this.vfs, conditions }),
        ...(wasmURL === undefined ? {} : { wasmURL }),
        ...(esbuild === undefined ? {} : { esbuild }),
        transforms: [...transforms, new TailwindTransform(), new SassTransform()],
      });
    this.installer =
      installer ??
      new RegistryInstaller({
        vfs: this.vfs,
        ...(registryUrl === undefined ? {} : { registryUrl }),
        ...(packageCache === undefined ? {} : { cache: packageCache }),
        ...(fetchImpl === undefined ? {} : { fetch: fetchImpl }),
      });
  }

  /** Reads `/package.json` and fills `/node_modules`. Never runs a lifecycle script. */
  async install(options?: InstallOptions): Promise<InstallResult> {
    return this.installer.install(options);
  }

  /** Does not write to the VFS. That is what lets `watch` run without a build firing itself. */
  async build(options?: BuildOptions): Promise<BuildResult> {
    return this.bundler.build(options);
  }

  watch(
    listener: VfsWatchListener,
    { debounceMs = DEFAULT_DEBOUNCE_MS }: WatchOptions = {},
  ): Disposer {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last: VfsWatchEvent | undefined;

    return this.vfs.watch((event) => {
      last = event;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        if (last) listener(last);
      }, debounceMs);
    });
  }

  snapshot(): VfsSnapshot {
    return this.vfs.snapshot();
  }

  async dispose(): Promise<void> {
    return this.bundler.dispose();
  }
}
