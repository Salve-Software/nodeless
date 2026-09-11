import type { Vfs } from '@/types/index.js';

export interface NodeResolverOptions {
  vfs: Vfs;
  conditions?: string[];
}
