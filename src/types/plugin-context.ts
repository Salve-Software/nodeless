import type { Vfs } from './vfs.js';

/** What a hook can reach: the filesystem, and resolution from wherever it is standing. */
export interface PluginContext {
  vfs: Vfs;
  resolve(source: string, importer: string): string | undefined;
}
