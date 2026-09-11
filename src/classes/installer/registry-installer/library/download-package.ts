import type {
  InstallScope,
  PackumentVersion,
} from '@/classes/installer/registry-installer/types/index.js';
import type { FileMap } from '@/types/index.js';
import { extractTarball } from './extract-tarball.js';
import { fetchTarball } from './fetch-tarball.js';
import { verifyIntegrity } from './verify-integrity.js';

/** One download per `name@version` per run, even when several dependents ask at once. */
export async function downloadPackage(
  scope: InstallScope,
  { name, version }: { name: string; version: PackumentVersion },
): Promise<FileMap> {
  const key = `${name}@${version.version}`;
  const pending = scope.downloads.get(key) ?? extract(scope, { key, version });

  scope.downloads.set(key, pending);

  return pending;
}

async function extract(
  scope: InstallScope,
  { key, version }: { key: string; version: PackumentVersion },
): Promise<FileMap> {
  const cached = await scope.cache.get(key);

  if (cached) return cached;

  const tarball = await fetchTarball(scope, version.dist.tarball);

  await verifyIntegrity(tarball, version.dist.integrity);

  const files = extractTarball(tarball);

  await scope.cache.set(key, files);

  return files;
}
