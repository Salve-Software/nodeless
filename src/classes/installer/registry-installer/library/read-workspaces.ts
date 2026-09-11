import type { Vfs } from '@/types/index.js';
import { PACKAGE_JSON_PATH } from '@/classes/installer/registry-installer/constants/index.js';
import { joinPath } from '@/library/index.js';
import { expandWorkspacePattern } from './expand-workspace-pattern.js';

/** Package name to the directory holding it, for everything `workspaces` points at. */
export function readWorkspaces(vfs: Vfs): Map<string, string> {
  const found = new Map<string, string>();

  for (const pattern of patternsOf(vfs, PACKAGE_JSON_PATH)) {
    for (const dir of expandWorkspacePattern(vfs, pattern)) {
      const name = nameOf(vfs, joinPath(dir, 'package.json'));

      if (name !== undefined) found.set(name, dir);
    }
  }

  return found;
}

function patternsOf(vfs: Vfs, path: string): string[] {
  const manifest = parse(vfs, path);
  const declared = manifest?.workspaces;

  if (Array.isArray(declared)) return declared;

  return Array.isArray(declared?.packages) ? declared.packages : [];
}

function nameOf(vfs: Vfs, path: string): string | undefined {
  const name = parse(vfs, path)?.name;

  return typeof name === 'string' && name !== '' ? name : undefined;
}

function parse(
  vfs: Vfs,
  path: string,
): { name?: string; workspaces?: string[] | { packages?: string[] } } | undefined {
  const bytes = vfs.tryReadFile(path);

  if (!bytes) return undefined;

  try {
    return JSON.parse(vfs.readText(path)) as { name?: string };
  } catch {
    return undefined;
  }
}
