import { MODULE_GLOBALS_PATTERN } from '@/classes/runtime/module-runtime/constants/index.js';
import { dirname } from '@/library/index.js';

/** A CommonJS dependency reads `__dirname` off its scope, and an iife bundle has none. */
export function injectModuleGlobals(source: string, path: string): string {
  if (!MODULE_GLOBALS_PATTERN.test(source)) return source;

  const header = `var __filename = ${JSON.stringify(path)}, __dirname = ${JSON.stringify(dirname(path))};`;

  return `${header}\n${source}`;
}
