import type { InstallRequest } from '@/classes/installer/registry-installer/types/index.js';
import type { InstallOptions, Vfs } from '@/types/index.js';
import { PACKAGE_JSON_PATH } from '@/classes/installer/registry-installer/constants/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { InstallError } from '@/errors/index.js';

/** `dev` matters because a Vite project keeps tailwindcss and friends in devDependencies. */
export function readRootDependencies(
  vfs: Vfs,
  { dev = false }: InstallOptions = {},
): InstallRequest[] {
  const bytes = vfs.tryReadFile(PACKAGE_JSON_PATH);

  if (!bytes) {
    throw new InstallError(`No ${PACKAGE_JSON_PATH} in the virtual filesystem`, {
      path: PACKAGE_JSON_PATH,
    });
  }

  const manifest = parse(vfs.readText(PACKAGE_JSON_PATH));
  const declared = {
    ...wanted(manifest.devDependencies ?? {}, dev),
    ...manifest.dependencies,
  };

  return Object.entries(declared).map(([name, range]) => ({
    name,
    range,
    parentDir: ROOT_PATH,
  }));
}

function wanted(
  devDependencies: Record<string, string>,
  dev: boolean | string[],
): Record<string, string> {
  if (dev === false) return {};
  if (dev === true) return devDependencies;

  return Object.fromEntries(
    dev
      .filter((name) => name in devDependencies)
      .map((name) => [name, devDependencies[name] ?? '']),
  );
}

function parse(text: string): {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} {
  try {
    return JSON.parse(text) as { dependencies?: Record<string, string> };
  } catch {
    throw new InstallError(`${PACKAGE_JSON_PATH} is not valid JSON`, {
      path: PACKAGE_JSON_PATH,
    });
  }
}
