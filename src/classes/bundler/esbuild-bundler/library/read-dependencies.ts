import type { Vfs } from '@/types/index.js';
import { PROJECT_MANIFEST_PATH } from '@/classes/bundler/esbuild-bundler/constants/index.js';

/** Ranges to pin CDN imports against. A missing or broken manifest just means no pinning. */
export function readDependencies(vfs: Vfs): Record<string, string> {
  const bytes = vfs.tryReadFile(PROJECT_MANIFEST_PATH);

  if (!bytes) return {};

  try {
    const parsed = JSON.parse(vfs.readText(PROJECT_MANIFEST_PATH)) as {
      dependencies?: Record<string, string>;
    };

    return parsed.dependencies ?? {};
  } catch {
    return {};
  }
}
