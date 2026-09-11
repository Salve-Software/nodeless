import type { FsReadOptions } from '@/classes/shims/node-shims/types/index.js';

export function readEncoding(options: FsReadOptions): string | undefined {
  if (typeof options === 'string') return options;

  return options?.encoding ?? undefined;
}
