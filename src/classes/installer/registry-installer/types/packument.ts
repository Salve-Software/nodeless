import type { PackumentVersion } from './packument-version.js';

/** The registry document for one package, in its abbreviated form. */
export interface Packument {
  name: string;
  'dist-tags': Record<string, string>;
  versions: Record<string, PackumentVersion>;
}
