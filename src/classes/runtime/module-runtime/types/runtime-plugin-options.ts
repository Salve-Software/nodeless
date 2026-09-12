import type { Resolver, Vfs } from '@/types/index.js';

export interface RuntimePluginOptions {
  vfs: Vfs;
  resolver: Resolver;
  isShimmed: (specifier: string) => boolean;
}
