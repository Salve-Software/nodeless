import type { Runtime, Vfs } from '@/types/index.js';

export interface ConfigLoaderOptions {
  vfs: Vfs;
  runtime: Runtime;
}
