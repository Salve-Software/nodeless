import type { Vfs } from './vfs.js';

/**
 * What a hook can reach: the filesystem, and resolution from wherever it is standing.
 * Property syntax, because a plugin destructures `this` as often as it uses it.
 */
export interface PluginContext {
  vfs: Vfs;
  resolve: (source: string, importer: string) => string | undefined;
}
