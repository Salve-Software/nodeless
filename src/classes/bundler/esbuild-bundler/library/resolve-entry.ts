import type { Vfs } from '@/types/index.js';
import { ENTRY_CANDIDATES } from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { normalizePath } from '@/library/index.js';

export function resolveEntry(vfs: Vfs, entry: string | undefined): string | undefined {
  if (entry !== undefined) {
    const normalized = normalizePath(entry);

    return vfs.stat(normalized)?.type === 'file' ? normalized : undefined;
  }

  return ENTRY_CANDIDATES.find((candidate) => vfs.stat(candidate)?.type === 'file');
}
