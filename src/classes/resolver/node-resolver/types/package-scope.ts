import type { PackageManifest } from './package-manifest.js';

/** The nearest `package.json` to a directory, and where it sits. */
export interface PackageScope {
  dir: string;
  manifest: PackageManifest;
}
