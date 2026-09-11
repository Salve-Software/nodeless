import type { PluginContainerOptions } from './types/index.js';
import type {
  Plugin,
  PluginContext,
  ResolvedConfig,
  TransformLoader,
} from '@/types/index.js';
import {
  normalizeCodeResult,
  normalizeResolveResult,
  orderPlugins,
} from './library/index.js';

/**
 * Runs the Rollup and Vite hooks in Vite's order. `resolveId` and `load` stop at the first
 * plugin that claims the module; `transform` is a pipeline and every plugin sees the last
 * one's output.
 */
export class PluginContainer {
  private readonly plugins: Plugin[];
  private readonly context: PluginContext;

  constructor({ plugins, vfs, resolve }: PluginContainerOptions) {
    this.plugins = orderPlugins(plugins);
    this.context = { vfs, resolve };
  }

  async configResolved(config: ResolvedConfig): Promise<void> {
    for (const plugin of this.plugins) await plugin.configResolved?.(config);
  }

  async resolveId(
    source: string,
    importer: string,
  ): Promise<{ id: string; external: boolean } | undefined> {
    for (const plugin of this.plugins) {
      if (!plugin.resolveId) continue;

      const result = normalizeResolveResult(
        await plugin.resolveId.call(this.context, source, importer),
      );

      if (result) return result;
    }

    return undefined;
  }

  async load(
    id: string,
  ): Promise<{ code: string; loader?: TransformLoader } | undefined> {
    for (const plugin of this.plugins) {
      if (!plugin.load) continue;

      const result = normalizeCodeResult(await plugin.load.call(this.context, id));

      if (result) return result;
    }

    return undefined;
  }

  async transform(
    code: string,
    id: string,
  ): Promise<{ code: string; loader?: TransformLoader } | undefined> {
    let current = code;
    let loader: TransformLoader | undefined;
    let touched = false;

    for (const plugin of this.plugins) {
      if (!plugin.transform) continue;

      const result = normalizeCodeResult(
        await plugin.transform.call(this.context, current, id),
      );

      if (!result) continue;

      current = result.code;
      loader = result.loader ?? loader;
      touched = true;
    }

    if (!touched) return undefined;

    return { code: current, ...(loader === undefined ? {} : { loader }) };
  }

  hasHooks(): boolean {
    return this.plugins.length > 0;
  }
}
