import type { InstallRequest } from '@/classes/installer/registry-installer/types/index.js';
import type { Vfs } from '@/types/index.js';
import { PACKAGE_JSON_PATH } from '@/classes/installer/registry-installer/constants/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { InstallError } from '@/errors/index.js';

/** Only `dependencies`. devDependencies never reach a browser bundle. */
export function readRootDependencies(vfs: Vfs): InstallRequest[] {
  const bytes = vfs.tryReadFile(PACKAGE_JSON_PATH);

  if (!bytes) {
    throw new InstallError(`No ${PACKAGE_JSON_PATH} in the virtual filesystem`, {
      path: PACKAGE_JSON_PATH,
    });
  }

  const manifest = parse(vfs.readText(PACKAGE_JSON_PATH));

  return Object.entries(manifest.dependencies ?? {}).map(([name, range]) => ({
    name,
    range,
    parentDir: ROOT_PATH,
  }));
}

function parse(text: string): { dependencies?: Record<string, string> } {
  try {
    return JSON.parse(text) as { dependencies?: Record<string, string> };
  } catch {
    throw new InstallError(`${PACKAGE_JSON_PATH} is not valid JSON`, {
      path: PACKAGE_JSON_PATH,
    });
  }
}
