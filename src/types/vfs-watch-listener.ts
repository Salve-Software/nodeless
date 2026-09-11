import type { VfsWatchEvent } from './vfs-watch-event.js';

export type VfsWatchListener = (event: VfsWatchEvent) => void;
