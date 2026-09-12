import { IMPORT_META_URL_PATTERN } from '@/classes/runtime/module-runtime/constants/index.js';
import { FILE_SCHEME } from '@/classes/shims/node-shims/constants/index.js';

/**
 * `import.meta` does not survive an iife bundle, and `fileURLToPath(import.meta.url)` is how
 * half the toolchain finds its own directory. Textual, so a mention inside a string literal
 * is rewritten too — harmless, since the value it becomes is the one Node would have given.
 */
export function replaceImportMetaUrl(source: string, path: string): string {
  return source.replace(
    IMPORT_META_URL_PATTERN,
    JSON.stringify(`${FILE_SCHEME}${encodeURI(path)}`),
  );
}
