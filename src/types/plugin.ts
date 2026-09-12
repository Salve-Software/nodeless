import type { PluginContext } from './plugin-context.js';
import type { PluginLoadResult } from './plugin-load-result.js';
import type { PluginResolveResult } from './plugin-resolve-result.js';
import type { PluginTransformResult } from './plugin-transform-result.js';
import type { ResolvedConfig } from './resolved-config.js';

/**
 * The Rollup and Vite hook shape, which is what the ecosystem already writes against. The
 * point of matching it is that a plugin from npm costs no code here.
 */
export interface Plugin {
  name: string;
  enforce?: 'pre' | 'post';
  configResolved?(config: ResolvedConfig): void | Promise<void>;
  resolveId?(
    this: PluginContext,
    source: string,
    importer: string,
  ): PluginResolveResult | Promise<PluginResolveResult>;
  load?(this: PluginContext, id: string): PluginLoadResult | Promise<PluginLoadResult>;
  transform?(
    this: PluginContext,
    code: string,
    id: string,
  ): PluginTransformResult | Promise<PluginTransformResult>;
}
