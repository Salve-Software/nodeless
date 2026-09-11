import type { Lockfile } from './lockfile.js';

/** The outcome of `install()`. Unsatisfied peer dependencies come back as warnings, never installed. */
export interface InstallResult {
  installed: Record<string, string>;
  warnings: string[];
  lockfile: Lockfile;
}
