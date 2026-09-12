import type { VfsSnapshot } from '@/types/index.js';

/** What the main thread asks for. `patch` carries only what changed since the last message. */
export type WorkerCommand =
  | {
      type: 'init';
      snapshot: VfsSnapshot;
      cwd: string;
      env: Record<string, string>;
      conditions: string[];
    }
  | { type: 'patch'; written: Record<string, string>; removed: string[] }
  | { type: 'evaluate'; path: string; code: string }
  | { type: 'call'; handle: number; args: unknown[] }
  | { type: 'reset' };
