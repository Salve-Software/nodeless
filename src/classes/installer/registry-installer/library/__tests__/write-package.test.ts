import { describe, expect, it } from 'vitest';
import { writePackage } from '@/classes/installer/registry-installer/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { textToBytes } from '@/library/index.js';

describe('writePackage', () => {
  it('writes every file under the target directory', () => {
    const vfs = new MemoryVfs();

    writePackage(vfs, {
      dir: '/node_modules/p',
      files: { 'index.js': textToBytes('x'), 'lib/a.js': textToBytes('a') },
    });

    expect(vfs.readText('/node_modules/p/index.js')).toBe('x');
    expect(vfs.readText('/node_modules/p/lib/a.js')).toBe('a');
  });

  // Reinstalling over an older copy must not leave files the new version dropped.
  it('wipes what was there before', () => {
    const vfs = new MemoryVfs({ files: { '/node_modules/p/stale.js': 'old' } });

    writePackage(vfs, {
      dir: '/node_modules/p',
      files: { 'index.js': textToBytes('new') },
    });

    expect(vfs.exists('/node_modules/p/stale.js')).toBe(false);
    expect(vfs.readText('/node_modules/p/index.js')).toBe('new');
  });
});
