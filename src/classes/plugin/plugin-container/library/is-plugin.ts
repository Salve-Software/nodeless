import type { Plugin } from '@/types/index.js';

export function isPlugin(value: unknown): value is Plugin {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Plugin).name === 'string'
  );
}
