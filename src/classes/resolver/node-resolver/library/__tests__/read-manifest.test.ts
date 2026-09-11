import { describe, expect, it } from 'vitest';
import { readManifest } from '@/classes/resolver/node-resolver/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

describe('readManifest', () => {
  it('reads the package.json in the directory', () => {
    const vfs = new MemoryVfs({
      files: { '/p/package.json': '{"name":"p","main":"a.js"}' },
    });

    expect(readManifest(vfs, '/p')).toEqual({ name: 'p', main: 'a.js' });
  });

  it('no package.json gives undefined', () => {
    expect(readManifest(new MemoryVfs(), '/p')).toBeUndefined();
  });

  // A broken package in node_modules must not take the whole build down.
  it('invalid JSON counts as missing', () => {
    const vfs = new MemoryVfs({ files: { '/p/package.json': '{ nope' } });

    expect(readManifest(vfs, '/p')).toBeUndefined();
  });

  it('JSON that is not an object counts as missing', () => {
    const vfs = new MemoryVfs({ files: { '/p/package.json': '"text"' } });

    expect(readManifest(vfs, '/p')).toBeUndefined();
  });
});
