import type { Disposer } from './disposer.js';
import type { FileStat } from './file-stat.js';
import type { RmOptions } from './rm-options.js';
import type { VfsSnapshot } from './vfs-snapshot.js';
import type { VfsWatchListener } from './vfs-watch-listener.js';

/** In-memory filesystem. Synchronous by contract — that is what keeps the resolver sync. */
export interface Vfs {
  readFile(path: string): Uint8Array;
  readText(path: string): string;
  tryReadFile(path: string): Uint8Array | undefined;
  writeFile(path: string, content: string | Uint8Array): void;
  exists(path: string): boolean;
  stat(path: string): FileStat | undefined;
  readdir(path: string): string[];
  mkdir(path: string): void;
  rm(path: string, options?: RmOptions): void;
  paths(): string[];
  watch(listener: VfsWatchListener): Disposer;
  snapshot(): VfsSnapshot;
}
