import type { PathMapping } from '@/classes/resolver/node-resolver/types/index.js';
import type { AliasEntry } from '@/types/index.js';

/** A config alias is a prefix replacement, which is one `PathMapping` with no suffix. */
export function toAliasMappings(aliases: AliasEntry[]): PathMapping[] {
  return aliases
    .map((alias) => ({ prefix: alias.find, suffix: '', targets: [alias.replacement] }))
    .sort((a, b) => b.prefix.length - a.prefix.length);
}
