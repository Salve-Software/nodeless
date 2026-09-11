import type {
  BuildMessage,
  CdnOptions,
  Resolver,
  SourceTransform,
  Vfs,
} from '@/types/index.js';

/** `warnings` is an out-parameter: the plugin appends to it while the build runs. */
export interface VfsPluginOptions {
  vfs: Vfs;
  resolver: Resolver;
  external: string[];
  warnings: BuildMessage[];
  transforms?: SourceTransform[];
  cdn?: CdnOptions;
  assetLimit?: number;
}
