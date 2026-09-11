import type { InstalledPackage } from './installed-package.js';

export interface InstallProgress {
  installed: InstalledPackage[];
  warnings: string[];
}
