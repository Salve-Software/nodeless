import type { ModuleRuntimeOptions, RuntimeHost } from './types/index.js';
import type { EsbuildApi, Resolver, Runtime, RuntimeModule, Vfs } from '@/types/index.js';
import { NodeShims } from '@/classes/shims/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { initializeEsbuild, loadEsbuild } from '@/library/index.js';
import { MODULE_GLOBAL, RUNTIME_TARGET } from './constants/index.js';
import { createRuntimePlugin, evaluateModule, toRuntimeError } from './library/index.js';

/**
 * Runs the toolchain graph and nothing else. `vite.config.ts` and the plugins it imports go
 * through here; the project's own source never does, which is the line the whole design draws.
 */
export class ModuleRuntime implements Runtime {
  private readonly vfs: Vfs;
  private readonly resolver: Resolver;
  private readonly esbuild: EsbuildApi | undefined;
  private readonly wasmURL: string | undefined;
  private readonly shims: NodeShims;
  private readonly modules = new Map<string, Promise<RuntimeModule>>();

  constructor({ vfs, resolver, esbuild, wasmURL, cwd, env }: ModuleRuntimeOptions) {
    this.vfs = vfs;
    this.resolver = resolver;
    this.esbuild = esbuild;
    this.wasmURL = wasmURL;
    this.shims = new NodeShims({
      vfs,
      cwd: cwd ?? ROOT_PATH,
      env: env ?? {},
      require: (specifier) => this.requireShim(specifier),
    });
  }

  /** Cached per path: a config that imports the same plugin twice gets the same instance. */
  async import(path: string): Promise<RuntimeModule> {
    const pending = this.modules.get(path) ?? this.evaluate(path);

    this.modules.set(path, pending);

    return pending;
  }

  invalidate(): void {
    this.modules.clear();
    this.resolver.invalidate?.();
  }

  async dispose(): Promise<void> {
    this.invalidate();
  }

  private async evaluate(path: string): Promise<RuntimeModule> {
    const api = this.esbuild ?? (await loadEsbuild());

    await initializeEsbuild(api, this.wasmURL);

    const result = await api.build({
      entryPoints: [path],
      bundle: true,
      write: false,
      format: 'iife',
      globalName: MODULE_GLOBAL,
      // `browser` would substitute a literal for `process.env.NODE_ENV`; the shim owns it.
      platform: 'neutral',
      target: RUNTIME_TARGET,
      absWorkingDir: ROOT_PATH,
      logLevel: 'silent',
      sourcemap: 'inline',
      plugins: [
        createRuntimePlugin({
          vfs: this.vfs,
          resolver: this.resolver,
          shims: this.shims,
        }),
      ],
    });

    const code = result.outputFiles?.[0]?.text;

    if (code === undefined) throw toRuntimeError(new Error('emitted nothing'), path);

    return evaluateModule({ code, path, host: this.host() });
  }

  private host(): RuntimeHost {
    return {
      shim: (name) => this.shims.get(name) ?? {},
      require: (specifier) => this.requireShim(specifier),
    };
  }

  /**
   * Only builtins. A `require` with a computed specifier cannot be bundled, and answering it
   * with an empty module would fail later and somewhere else.
   */
  private requireShim(specifier: string): RuntimeModule {
    const shim = this.shims.get(specifier);

    if (shim) return shim;

    throw new Error(
      `require("${specifier}") at run time is not supported: the config graph is bundled ahead of evaluation, so only a static import can be resolved.`,
    );
  }
}
