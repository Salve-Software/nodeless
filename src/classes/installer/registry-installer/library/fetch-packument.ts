import type {
  InstallScope,
  Packument,
} from '@/classes/installer/registry-installer/types/index.js';
import { ABBREVIATED_PACKUMENT } from '@/classes/installer/registry-installer/constants/index.js';
import { InstallError } from '@/errors/index.js';

/** One fetch per package per run: concurrent callers share the same promise. */
export async function fetchPackument(
  scope: InstallScope,
  name: string,
): Promise<Packument> {
  const pending =
    scope.packuments.get(name) ??
    requestPackument(scope, name).catch((error: unknown) => {
      scope.packuments.delete(name);
      throw error;
    });

  scope.packuments.set(name, pending);

  return pending;
}

async function requestPackument(scope: InstallScope, name: string): Promise<Packument> {
  const url = `${scope.registryUrl}/${name.replace('/', '%2f')}`;
  const response = await scope.fetch(url, { headers: { accept: ABBREVIATED_PACKUMENT } });

  if (!response.ok) {
    throw new InstallError(`Registry answered ${String(response.status)} for "${name}"`, {
      name,
      url,
      status: response.status,
    });
  }

  return (await response.json()) as Packument;
}
