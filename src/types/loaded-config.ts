import type { AliasEntry } from './alias-entry.js';
import type { Plugin } from './plugin.js';

/** What a project's config file contributes to a build. Absent config gives every field empty. */
export interface LoadedConfig {
  path?: string;
  plugins: Plugin[];
  define: Record<string, string>;
  aliases: AliasEntry[];
  outdir?: string;
  base?: string;
}
