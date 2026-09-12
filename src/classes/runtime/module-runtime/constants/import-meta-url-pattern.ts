/**
 * `import.meta` does not survive an iife bundle, and `fileURLToPath(import.meta.url)` is
 * how half the toolchain finds its own directory. It becomes the file's URL literal.
 */
export const IMPORT_META_URL_PATTERN = /\bimport\.meta\.url\b/g;
