import { describe, expect, it } from 'vitest';
import { readPackageTree } from '@/classes/installer/registry-installer/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { bytesToText } from '@/library/index.js';

const vfs = new MemoryVfs({
  files: {
    '/packages/types/package.json': '{"name":"@local/types"}',
    '/packages/types/src/index.ts': 'export type Id = string;',
    '/packages/types/node_modules/dep/index.js': 'nested',
    '/packages/other/index.ts': 'x',
  },
});

describe('readPackageTree', () => {
  it('keys every file relative to the directory', () => {
    expect(Object.keys(readPackageTree(vfs, '/packages/types')).sort()).toEqual([
      'package.json',
      'src/index.ts',
    ]);
  });

  it('keeps the contents intact', () => {
    const files = readPackageTree(vfs, '/packages/types');

    expect(bytesToText(files['src/index.ts'] ?? new Uint8Array())).toBe(
      'export type Id = string;',
    );
  });

  // Copying a workspace package's own node_modules would duplicate the whole tree.
  it('leaves the package node_modules behind', () => {
    expect(Object.keys(readPackageTree(vfs, '/packages/types'))).not.toContain(
      'node_modules/dep/index.js',
    );
  });
});
