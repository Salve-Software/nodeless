import type { AliasEntry, Vfs } from '@/types/index.js';

/** `aliases` come from the project's config and win over `compilerOptions.paths`. */
export interface NodeResolverOptions {
  vfs: Vfs;
  conditions?: string[];
  aliases?: AliasEntry[];
}
