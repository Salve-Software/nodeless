import { ROOT_PATH } from '@/constants/index.js';

/** Immediate children of `dir`, sorted and deduplicated. */
export function collectDirEntries(dir: string, paths: Iterable<string>): string[] {
  const prefix = dir === ROOT_PATH ? ROOT_PATH : `${dir}/`;
  const entries = new Set<string>();

  for (const path of paths) {
    if (path === dir || !path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    const slash = rest.indexOf('/');
    entries.add(slash === -1 ? rest : rest.slice(0, slash));
  }

  return [...entries].sort();
}
