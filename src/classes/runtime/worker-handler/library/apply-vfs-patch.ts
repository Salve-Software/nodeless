import type { Vfs } from '@/types/index.js';
import { base64ToBytes } from '@/library/index.js';

/** Only what changed crosses the channel: a full snapshot per build would cost more than the build. */
export function applyVfsPatch(
  vfs: Vfs,
  { written, removed }: { written: Record<string, string>; removed: string[] },
): void {
  for (const path of removed) vfs.rm(path);
  for (const [path, base64] of Object.entries(written)) {
    vfs.writeFile(path, base64ToBytes(base64));
  }
}
