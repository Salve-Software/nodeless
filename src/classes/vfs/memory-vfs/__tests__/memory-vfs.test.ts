import { describe, expect, it, vi } from 'vitest';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { FileNotFoundError, InvalidSnapshotError } from '@/errors/index.js';
import { textToBytes } from '@/library/index.js';

describe('MemoryVfs', () => {
  it('normalizes the path on write and on read', () => {
    const vfs = new MemoryVfs({ files: { 'src/main.tsx': 'export {};' } });

    expect(vfs.readText('/src/main.tsx')).toBe('export {};');
    expect(vfs.readText('/src/./main.tsx')).toBe('export {};');
  });

  it('takes bytes and text through the same API', () => {
    const vfs = new MemoryVfs({ files: { '/a.bin': new Uint8Array([1, 2]) } });

    expect(vfs.readFile('/a.bin')).toEqual(new Uint8Array([1, 2]));
  });

  it('a missing file throws with the path', () => {
    const vfs = new MemoryVfs();

    expect(() => vfs.readFile('/nope.ts')).toThrow(FileNotFoundError);
    expect(vfs.tryReadFile('/nope.ts')).toBeUndefined();
  });

  it('writing creates the directories along the path', () => {
    const vfs = new MemoryVfs();

    vfs.writeFile('/a/b/c.ts', 'x');

    expect(vfs.stat('/a')?.type).toBe('directory');
    expect(vfs.stat('/a/b')?.type).toBe('directory');
    expect(vfs.readdir('/a')).toEqual(['b']);
  });

  it('mkdir creates an empty folder that readdir can see', () => {
    const vfs = new MemoryVfs();

    vfs.mkdir('/node_modules/.cache');

    expect(vfs.readdir('/node_modules')).toEqual(['.cache']);
    expect(vfs.readdir('/node_modules/.cache')).toEqual([]);
  });

  it('readdir on a missing directory throws', () => {
    expect(() => new MemoryVfs().readdir('/nope')).toThrow(FileNotFoundError);
  });

  it('stat tells file from directory and reports the size', () => {
    const vfs = new MemoryVfs({ files: { '/a/b.ts': 'abc' } });

    expect(vfs.stat('/a/b.ts')).toEqual({ path: '/a/b.ts', type: 'file', size: 3 });
    expect(vfs.stat('/a')).toEqual({ path: '/a', type: 'directory', size: 0 });
    expect(vfs.stat('/nope')).toBeUndefined();
  });

  it('rm without recursive leaves the subtree alone', () => {
    const vfs = new MemoryVfs({ files: { '/a/b.ts': 'x' } });

    vfs.rm('/a');

    expect(vfs.exists('/a/b.ts')).toBe(true);
  });

  it('rm recursive deletes the files and directories inside', () => {
    const vfs = new MemoryVfs({
      files: { '/a/b.ts': 'x', '/a/c/d.ts': 'y', '/e.ts': 'z' },
    });

    vfs.rm('/a', { recursive: true });

    expect(vfs.paths()).toEqual(['/e.ts']);
    expect(vfs.exists('/a/c')).toBe(false);
  });

  it('watch reports writes and removals, and the disposer stops it', () => {
    const vfs = new MemoryVfs();
    const listener = vi.fn();
    const unwatch = vfs.watch(listener);

    vfs.writeFile('/a.ts', 'x');
    vfs.rm('/a.ts');
    unwatch();
    vfs.writeFile('/b.ts', 'y');

    expect(listener.mock.calls.map(([event]) => event)).toEqual([
      { path: '/a.ts', type: 'write' },
      { path: '/a.ts', type: 'remove' },
    ]);
  });

  it('a snapshot round-trips bytes and empty folders', () => {
    const origin = new MemoryVfs({ files: { '/a.bin': new Uint8Array([0, 255]) } });

    origin.mkdir('/empty');

    const clone = new MemoryVfs({ snapshot: origin.snapshot() });

    expect(clone.readFile('/a.bin')).toEqual(new Uint8Array([0, 255]));
    expect(clone.readdir('/empty')).toEqual([]);
  });

  it('a snapshot of an unknown version is rejected', () => {
    expect(
      () => new MemoryVfs({ snapshot: { version: 99, files: {}, directories: [] } }),
    ).toThrow(InvalidSnapshotError);
  });

  it('files override the snapshot, so the snapshot can act as the base', () => {
    const origin = new MemoryVfs({ files: { '/a.ts': 'old' } });
    const clone = new MemoryVfs({
      snapshot: origin.snapshot(),
      files: { '/a.ts': 'new' },
    });

    expect(clone.readText('/a.ts')).toBe('new');
  });

  it('paths comes back sorted and holds files only', () => {
    const vfs = new MemoryVfs({ files: { '/b.ts': 'x', '/a.ts': 'y' } });

    vfs.mkdir('/dir');

    expect(vfs.paths()).toEqual(['/a.ts', '/b.ts']);
  });

  it('readText decodes UTF-8', () => {
    const vfs = new MemoryVfs({ files: { '/a.ts': textToBytes('// café') } });

    expect(vfs.readText('/a.ts')).toBe('// café');
  });
});
