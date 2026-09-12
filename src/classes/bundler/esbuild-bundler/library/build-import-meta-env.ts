import type { BuildMode } from '@/types/index.js';

/**
 * Vite replaces `import.meta.env` at build time. Left alone it is `undefined` in a plain
 * module, so the first line that reads an env throws instead of returning nothing.
 */
export function buildImportMetaEnv(
  mode: BuildMode,
  extra: Record<string, string> = {},
): Record<string, string | boolean> {
  return {
    MODE: mode,
    DEV: mode === 'development',
    PROD: mode === 'production',
    BASE_URL: '/',
    SSR: false,
    ...extra,
  };
}
