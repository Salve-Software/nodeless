import { describe, expect, it } from 'vitest';
import { collectDirEntries } from '@/classes/vfs/memory-vfs/library/index.js';

const PATHS = [
  '/package.json',
  '/src/main.tsx',
  '/src/lib/x.ts',
  '/src/lib/y.ts',
  '/node_modules/react/index.js',
];

describe('collectDirEntries', () => {
  it('lists immediate children only', () => {
    expect(collectDirEntries('/src', PATHS)).toEqual(['lib', 'main.tsx']);
  });

  it('does not repeat a subfolder holding several files', () => {
    expect(collectDirEntries('/src/lib', PATHS)).toEqual(['x.ts', 'y.ts']);
  });

  it('the root does not grow an extra slash in the prefix', () => {
    expect(collectDirEntries('/', PATHS)).toEqual([
      'node_modules',
      'package.json',
      'src',
    ]);
  });

  it('a directory with no children gives an empty list', () => {
    expect(collectDirEntries('/dist', PATHS)).toEqual([]);
  });

  // `/srcfoo` starts with `/src` but is not inside it.
  it('a lookalike prefix does not count as a child', () => {
    expect(collectDirEntries('/src', ['/srcfoo/x.ts'])).toEqual([]);
  });
});
