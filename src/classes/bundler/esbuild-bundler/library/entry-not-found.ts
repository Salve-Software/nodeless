import { NO_ENTRY_MESSAGE } from '@/classes/bundler/esbuild-bundler/constants/index.js';
import { normalizePath } from '@/library/index.js';

/** Two different failures: nothing to build, or a path that was asked for and is not there. */
export function entryNotFound(entry: string | undefined): string {
  if (entry === undefined) return NO_ENTRY_MESSAGE;

  return `Entry point not found in the virtual filesystem: ${normalizePath(entry)}`;
}
