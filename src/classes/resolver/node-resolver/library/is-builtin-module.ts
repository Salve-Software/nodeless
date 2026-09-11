import { BUILTIN_MODULES } from '@/classes/resolver/node-resolver/constants/index.js';

export function isBuiltinModule(specifier: string): boolean {
  return BUILTIN_MODULES.has(specifier.replace(/^node:/, ''));
}
