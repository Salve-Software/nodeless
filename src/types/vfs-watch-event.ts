export interface VfsWatchEvent {
  path: string;
  type: 'write' | 'remove';
}
