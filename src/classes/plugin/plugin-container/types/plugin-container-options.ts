import type { Plugin, Vfs } from '@/types/index.js';

export interface PluginContainerOptions {
  plugins: Plugin[];
  vfs: Vfs;
  resolve: (source: string, importer: string) => string | undefined;
}
