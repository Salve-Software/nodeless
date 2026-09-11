import type { InstallRequest } from './install-request.js';
import type { PackumentVersion } from './packument-version.js';
import type { FileMap } from '@/types/index.js';

export interface ResolvedPackage {
  request: InstallRequest;
  version: PackumentVersion;
  tarball: string;
  files: FileMap;
}
