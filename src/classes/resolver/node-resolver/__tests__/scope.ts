import type { ResolveScope } from '@/classes/resolver/node-resolver/types/index.js';
import type { FileInput } from '@/types/index.js';
import { readManifest } from '@/classes/resolver/node-resolver/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { DEFAULT_CONDITIONS } from '@/constants/index.js';

/** A resolution scope over a VFS built on the spot. No cache, to keep the test direct. */
export function createScope(
  files: FileInput,
  conditions = DEFAULT_CONDITIONS,
): ResolveScope {
  const vfs = new MemoryVfs({ files });

  return { vfs, conditions, readManifest: (dir) => readManifest(vfs, dir) };
}

export function manifest(content: Record<string, unknown>): string {
  return JSON.stringify(content);
}
