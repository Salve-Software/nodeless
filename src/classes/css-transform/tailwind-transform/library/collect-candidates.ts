import type { Vfs } from '@/types/index.js';
import {
  CANDIDATE_PATTERN,
  SCANNED_EXTENSIONS,
} from '@/classes/css-transform/tailwind-transform/constants/index.js';
import { extname } from '@/library/index.js';

/** Everything outside node_modules is scanned, which is a superset of what `@source` asks for. */
export function collectCandidates(vfs: Vfs): string[] {
  const found = new Set<string>();

  for (const path of vfs.paths()) {
    if (path.startsWith('/node_modules/')) continue;
    if (!SCANNED_EXTENSIONS.has(extname(path))) continue;

    for (const token of vfs.readText(path).match(CANDIDATE_PATTERN) ?? [])
      found.add(token);
  }

  return [...found];
}
