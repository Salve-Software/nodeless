import type { PackageManifest } from '@/classes/resolver/node-resolver/types/index.js';
import type { Vfs } from '@/types/index.js';
import { bytesToText, joinPath } from '@/library/index.js';

/** An invalid `package.json` counts as missing — a broken package must not kill the build. */
export function readManifest(vfs: Vfs, dir: string): PackageManifest | undefined {
  const bytes = vfs.tryReadFile(joinPath(dir, 'package.json'));

  if (!bytes) return undefined;

  try {
    const parsed: unknown = JSON.parse(bytesToText(bytes));

    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}
