import type { FileMap } from '@/types/index.js';
import { gunzipSync } from 'fflate';
import { stripRootDir } from './strip-root-dir.js';
import { untar } from './untar.js';

/** A `.tgz` from the registry into the files it carries, rooted at the package itself. */
export function extractTarball(tarball: Uint8Array): FileMap {
  return stripRootDir(untar(gunzipSync(tarball)));
}
