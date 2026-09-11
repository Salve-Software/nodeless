import type { NodeShims } from '@/classes/shims/index.js';
import type { Resolver, Vfs } from '@/types/index.js';

export interface RuntimePluginOptions {
  vfs: Vfs;
  resolver: Resolver;
  shims: NodeShims;
}
