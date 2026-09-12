import { describe, expect, it } from 'vitest';
import { collectPublicFiles } from '@/classes/bundler/esbuild-bundler/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { bytesToText } from '@/library/index.js';

const vfs = new MemoryVfs({
  files: {
    '/public/favicon.svg': '<svg/>',
    '/public/img/logo.png': 'binary',
    '/src/main.ts': 'x',
  },
});

describe('collectPublicFiles', () => {
  it('keys every file relative to the public directory', () => {
    expect(Object.keys(collectPublicFiles(vfs, '/public')).sort()).toEqual([
      'favicon.svg',
      'img/logo.png',
    ]);
  });

  it('copies the contents untouched', () => {
    expect(
      bytesToText(collectPublicFiles(vfs, '/public')['favicon.svg'] ?? new Uint8Array()),
    ).toBe('<svg/>');
  });

  it('a project without one gives nothing', () => {
    expect(collectPublicFiles(vfs, '/static')).toEqual({});
  });
});
