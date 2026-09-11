import type { InstallScope } from '@/classes/installer/registry-installer/types/index.js';
import { InstallError } from '@/errors/index.js';

export async function fetchTarball(
  scope: InstallScope,
  url: string,
): Promise<Uint8Array> {
  const response = await scope.fetch(url);

  if (!response.ok) {
    throw new InstallError(`Tarball answered ${String(response.status)}`, {
      url,
      status: response.status,
    });
  }

  return new Uint8Array(await response.arrayBuffer());
}
