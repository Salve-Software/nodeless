import { bytesToText } from '@/library/index.js';

/** TAR pads fields with NUL bytes; everything from the first one is padding. */
export function readTarString(
  bytes: Uint8Array,
  field: { offset: number; length: number },
): string {
  const slice = bytes.subarray(field.offset, field.offset + field.length);
  const end = slice.indexOf(0);

  return bytesToText(end === -1 ? slice : slice.subarray(0, end)).trim();
}
