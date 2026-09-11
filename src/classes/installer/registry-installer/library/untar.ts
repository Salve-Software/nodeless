import type { FileMap } from '@/types/index.js';
import {
  TAR_BLOCK_SIZE,
  TAR_HEADER,
} from '@/classes/installer/registry-installer/constants/index.js';
import { readPaxPath } from './read-pax-path.js';
import { readTarSize } from './read-tar-size.js';
import { readTarString } from './read-tar-string.js';

/** Reads a plain TAR into a file map. Directories, links and metadata entries are dropped. */
export function untar(bytes: Uint8Array): FileMap {
  const files: FileMap = {};
  let offset = 0;
  let overrideName: string | undefined;

  while (offset + TAR_BLOCK_SIZE <= bytes.length) {
    const header = bytes.subarray(offset, offset + TAR_BLOCK_SIZE);

    // Two zero blocks mark the end; one is enough to stop reading.
    if (header.every((byte) => byte === 0)) break;

    const size = readTarSize(header);
    const typeFlag = readTarString(header, TAR_HEADER.typeFlag);
    const dataStart = offset + TAR_BLOCK_SIZE;
    const data = bytes.subarray(dataStart, dataStart + size);

    offset = dataStart + Math.ceil(size / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE;

    if (typeFlag === 'L') {
      overrideName = readTarString(data, { offset: 0, length: data.length });
      continue;
    }
    if (typeFlag === 'x' || typeFlag === 'g') {
      overrideName = readPaxPath(data) ?? overrideName;
      continue;
    }
    // '' is the NUL type flag, which is a regular file just like '0'.
    if (typeFlag !== '' && typeFlag !== '0') {
      overrideName = undefined;
      continue;
    }

    const prefix = readTarString(header, TAR_HEADER.prefix);
    const name = readTarString(header, TAR_HEADER.name);

    // `subarray` is a view over the whole tarball; copying lets it be collected.
    files[overrideName ?? (prefix === '' ? name : `${prefix}/${name}`)] = data.slice();
    overrideName = undefined;
  }

  return files;
}
