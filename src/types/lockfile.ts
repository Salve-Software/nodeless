import type { LockfileEntry } from './lockfile-entry.js';

export interface Lockfile {
  lockfileVersion: number;
  packages: Record<string, LockfileEntry>;
}
