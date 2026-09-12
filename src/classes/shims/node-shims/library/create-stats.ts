import type { FileStat } from '@/types/index.js';

/** The slice of `fs.Stats` a build tool reads. `mtime` is fixed: the VFS has no clock. */
export function createStats(stat: FileStat): Record<string, unknown> {
  const epoch = new Date(0);

  return {
    size: stat.size,
    mtime: epoch,
    mtimeMs: 0,
    ctime: epoch,
    ctimeMs: 0,
    atime: epoch,
    atimeMs: 0,
    birthtime: epoch,
    birthtimeMs: 0,
    mode: stat.type === 'directory' ? 0o040755 : 0o100644,
    isFile: () => stat.type === 'file',
    isDirectory: () => stat.type === 'directory',
    isSymbolicLink: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  };
}
