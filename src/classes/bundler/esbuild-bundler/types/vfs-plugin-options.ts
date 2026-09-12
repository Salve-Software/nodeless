import type { PluginContainer } from '@/classes/plugin/index.js';
import type { BuildMessage, CdnOptions, Resolver, Vfs } from '@/types/index.js';

/** `warnings` is an out-parameter: the plugin appends to it while the build runs. */
export interface VfsPluginOptions {
  vfs: Vfs;
  resolver: Resolver;
  external: string[];
  warnings: BuildMessage[];
  container?: PluginContainer;
  cdn?: CdnOptions;
  assetLimit?: number;
}
