import { TAR_HEADER } from '@/classes/installer/registry-installer/constants/index.js';
import { readTarString } from './read-tar-string.js';

/** The size field is octal text. npm never emits the GNU base-256 form. */
export function readTarSize(header: Uint8Array): number {
  const raw = readTarString(header, TAR_HEADER.size);
  const size = Number.parseInt(raw, 8);

  return Number.isFinite(size) && size >= 0 ? size : 0;
}
