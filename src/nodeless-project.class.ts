import type {
  BuildOptions,
  BuildResult,
  Bundler,
  Disposer,
  InstallOptions,
  InstallResult,
  Installer,
  NodelessProjectOptions,
  Plugin,
  Runtime,
  Vfs,
  VfsSnapshot,
  VfsWatchEvent,
  VfsWatchListener,
  WatchOptions,
} from '@/types/index.js';
import { EsbuildBundler } from '@/classes/bundler/index.js';
import { CONFIG_CANDIDATES } from '@/classes/config/config-loader/constants/index.js';
import { ConfigLoader } from '@/classes/config/index.js';
import { RegistryInstaller } from '@/classes/installer/index.js';
import { PluginContainer } from '@/classes/plugin/index.js';
import { NodeResolver } from '@/classes/resolver/index.js';
import { ModuleRuntime, WorkerRuntime } from '@/classes/runtime/index.js';
import { RUNTIME_CONDITIONS } from '@/classes/runtime/module-runtime/constants/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { DEFAULT_CONDITIONS, DEFAULT_DEBOUNCE_MS } from '@/constants/index.js';
import { tryResolve } from '@/library/index.js';
import { sassPlugin, tailwindPlugin } from '@/plugins/index.js';

/** The library surface: a VFS, a build, and a snapshot to move between front end and API. */
export class NodelessProject {
  readonly vfs: Vfs;
  private readonly options: NodelessProjectOptions;
  private readonly installer: Installer;
  private readonly runtime: Runtime;
  private readonly config: ConfigLoader;
  private bundler: Bundler | undefined;
  private readonly unwatchConfig: Disposer;

  constructor(options: NodelessProjectOptions = {}) {
    const { files, snapshot, vfs, installer, runtime, registryUrl, packageCache } =
      options;

    this.options = options;
    this.vfs =
      vfs ??
      new MemoryVfs({ ...(files ? { files } : {}), ...(snapshot ? { snapshot } : {}) });
    this.runtime = runtime ?? this.createRuntime();
    this.config = new ConfigLoader({ vfs: this.vfs, runtime: this.runtime });
    this.bundler = options.bundler;
    this.installer =
      installer ??
      new RegistryInstaller({
        vfs: this.vfs,
        ...(registryUrl === undefined ? {} : { registryUrl }),
        ...(packageCache === undefined ? {} : { cache: packageCache }),
        ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      });

    // Vite restarts on a config edit for the same reason: the plugins are already built.
    this.unwatchConfig = this.vfs.watch((event) => {
      if (CONFIG_CANDIDATES.includes(event.path)) this.reset();
    });
  }

  /** Reads `/package.json` and fills `/node_modules`. Never runs a lifecycle script. */
  async install(options?: InstallOptions): Promise<InstallResult> {
    const result = await this.installer.install(options);

    // A config that was unresolvable before the install may resolve now.
    this.reset();

    return result;
  }

  /** Does not write to the VFS. That is what lets `watch` run without a build firing itself. */
  async build(options: BuildOptions = {}): Promise<BuildResult> {
    const config = await this.config.load(options.mode ?? 'production');
    const bundler = this.bundlerFor(config.plugins, config.aliases);
    const outdir = options.outdir ?? config.outdir;

    return bundler.build({
      ...options,
      define: { ...config.define, ...options.define },
      ...(outdir === undefined ? {} : { outdir }),
    });
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
    this.unwatchConfig();
    await this.runtime.dispose();
    await this.bundler?.dispose();
  }

  /**
   * `worker` is the hardened one: the toolchain runs off the page, with no DOM, no storage
   * and no network. The default stays in-process because it is the half that is isomorphic.
   */
  private createRuntime(): Runtime {
    const { esbuild, wasmURL, workerUrl, isolation = 'none' } = this.options;
    const shared = {
      vfs: this.vfs,
      resolver: new NodeResolver({ vfs: this.vfs, conditions: RUNTIME_CONDITIONS }),
      ...(esbuild === undefined ? {} : { esbuild }),
      ...(wasmURL === undefined ? {} : { wasmURL }),
    };

    if (isolation === 'none') return new ModuleRuntime(shared);

    return new WorkerRuntime({
      ...shared,
      conditions: RUNTIME_CONDITIONS,
      ...(workerUrl === undefined ? {} : { workerUrl }),
    });
  }

  /**
   * Built on the first build rather than in the constructor: the resolver needs the config's
   * aliases, and reading the config means running it, which cannot happen synchronously.
   */
  private bundlerFor(
    plugins: Plugin[],
    aliases: NonNullable<Awaited<ReturnType<ConfigLoader['load']>>['aliases']>,
  ): Bundler {
    if (this.bundler) return this.bundler;

    const { conditions = DEFAULT_CONDITIONS, esbuild, wasmURL } = this.options;
    const resolver = new NodeResolver({ vfs: this.vfs, conditions, aliases });

    this.bundler = new EsbuildBundler({
      vfs: this.vfs,
      resolver,
      ...(wasmURL === undefined ? {} : { wasmURL }),
      ...(esbuild === undefined ? {} : { esbuild }),
      container: new PluginContainer({
        vfs: this.vfs,
        resolve: (source, importer) =>
          tryResolve(resolver, { specifier: source, importer }),
        // Sass before Tailwind: a `.scss` file has to become CSS before anything reads
        // it as CSS. Tailwind claims a stylesheet on `@apply`, and would otherwise eat
        // the `@use` that Sass still needs.
        plugins: [
          ...(this.options.plugins ?? []),
          ...plugins,
          sassPlugin(),
          tailwindPlugin(),
        ],
      }),
    });

    return this.bundler;
  }

  private reset(): void {
    this.config.invalidate();
    if (!this.options.bundler) this.bundler = undefined;
  }
}
