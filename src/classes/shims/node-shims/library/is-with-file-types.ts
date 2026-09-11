import type { FsReadOptions } from '@/classes/shims/node-shims/types/index.js';

export function isWithFileTypes(options: FsReadOptions): boolean {
  return (
    typeof options === 'object' && options !== null && options.withFileTypes === true
  );
}
