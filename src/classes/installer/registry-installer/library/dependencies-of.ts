import type {
  InstallRequest,
  PackumentVersion,
} from '@/classes/installer/registry-installer/types/index.js';

export function dependenciesOf(
  version: PackumentVersion,
  parentDir: string,
): InstallRequest[] {
  return Object.entries(version.dependencies ?? {}).map(([name, range]) => ({
    name,
    range,
    parentDir,
  }));
}
