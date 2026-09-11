import type { ResolveScope } from '@/classes/resolver/node-resolver/types/index.js';
import { TYPESCRIPT_REWRITES } from '@/classes/resolver/node-resolver/constants/index.js';
import { extname } from '@/library/index.js';

export function loadAsFile(scope: ResolveScope, path: string): string | undefined {
  if (scope.vfs.stat(path)?.type === 'file') return path;

  for (const extension of scope.extensions) {
    const candidate = `${path}${extension}`;

    if (scope.vfs.stat(candidate)?.type === 'file') return candidate;
  }

  const extension = extname(path);
  const rewrites = TYPESCRIPT_REWRITES[extension];

  if (!rewrites) return undefined;

  const base = path.slice(0, path.length - extension.length);

  for (const rewrite of rewrites) {
    const candidate = `${base}${rewrite}`;

    if (scope.vfs.stat(candidate)?.type === 'file') return candidate;
  }

  return undefined;
}
