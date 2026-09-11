import { bytesToText } from '@/library/index.js';

// A pax record is `<length> <key>=<value>\n`. node-tar emits one when a path is
// too long for the ustar header, so ignoring it would lose the file name.
const PAX_PATH = /^\d+ path=(.*)$/;

export function readPaxPath(data: Uint8Array): string | undefined {
  for (const line of bytesToText(data).split('\n')) {
    const match = PAX_PATH.exec(line);

    if (match?.[1] !== undefined) return match[1];
  }

  return undefined;
}
