import type { ConfigLoaderOptions } from './types/index.js';
import type { BuildMode, LoadedConfig, Runtime, Vfs } from '@/types/index.js';
import { flattenPlugins } from '@/classes/plugin/index.js';
import { EMPTY_CONFIG } from './constants/index.js';
import {
  findConfigPath,
  readConfigAliases,
  readConfigDefine,
  readConfigOutput,
  resolveConfigExport,
} from './library/index.js';

/**
 * Finds the project's config file and runs it. This is the only place the two graphs meet:
 * what comes back is a list of plugins that shape how the other graph is built.
 */
export class ConfigLoader {
  private readonly vfs: Vfs;
  private readonly runtime: Runtime;
  private readonly loaded = new Map<BuildMode, Promise<LoadedConfig>>();

  constructor({ vfs, runtime }: ConfigLoaderOptions) {
    this.vfs = vfs;
    this.runtime = runtime;
  }

  /** Cached per mode: a rebuild reuses the plugin instances rather than re-running the config. */
  async load(mode: BuildMode = 'production'): Promise<LoadedConfig> {
    const pending = this.loaded.get(mode) ?? this.read(mode);

    this.loaded.set(mode, pending);

    return pending;
  }

  invalidate(): void {
    this.loaded.clear();
    this.runtime.invalidate?.();
  }

  private async read(mode: BuildMode): Promise<LoadedConfig> {
    const path = findConfigPath(this.vfs);

    if (path === undefined) return EMPTY_CONFIG;

    const config = await resolveConfigExport(await this.runtime.import(path), mode);

    return {
      path,
      plugins: flattenPlugins(config['plugins']),
      define: readConfigDefine(config),
      aliases: readConfigAliases(config),
      ...readConfigOutput(config),
    };
  }
}
