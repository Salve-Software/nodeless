import type { ResolveScope } from '@/classes/resolver/node-resolver/types/index.js';
import {
  CSS_CONDITIONS,
  CSS_RESOLVE_EXTENSIONS,
} from '@/classes/resolver/node-resolver/constants/index.js';
import { extname } from '@/library/index.js';

/** `@import 'pkg'` in a stylesheet must not land on the package's JavaScript entry. */
export function scopeForImporter(scope: ResolveScope, importer: string): ResolveScope {
  if (extname(importer) !== '.css') return scope;

  return { ...scope, conditions: CSS_CONDITIONS, extensions: CSS_RESOLVE_EXTENSIONS };
}
