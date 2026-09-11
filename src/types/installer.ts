import type { InstallOptions } from './install-options.js';
import type { InstallResult } from './install-result.js';

/** Populates `/node_modules` in the VFS from `/package.json`. Never runs a script. */
export interface Installer {
  install(options?: InstallOptions): Promise<InstallResult>;
}
