import type { ParsedPath } from '@/classes/shims/node-shims/types/index.js';

export function posixFormat(parsed: Partial<ParsedPath>): string {
  const base = parsed.base ?? `${parsed.name ?? ''}${parsed.ext ?? ''}`;
  const dir = parsed.dir ?? parsed.root ?? '';

  if (dir === '') return base;

  return dir === '/' ? `/${base}` : `${dir}/${base}`;
}
