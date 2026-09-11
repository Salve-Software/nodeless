import { describe, expect, it } from 'vitest';
import { expandWorkspacePattern } from '@/classes/installer/registry-installer/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

const vfs = new MemoryVfs({
  files: {
    '/packages/a/package.json': '{}',
    '/packages/b/package.json': '{}',
    '/packages/loose.txt': 'x',
    '/apps/web/package.json': '{}',
  },
});

describe('expandWorkspacePattern', () => {
  it('a star stands for one whole segment', () => {
    expect(expandWorkspacePattern(vfs, 'packages/*')).toEqual([
      '/packages/a',
      '/packages/b',
    ]);
  });

  it('a literal path resolves to itself', () => {
    expect(expandWorkspacePattern(vfs, 'apps/web')).toEqual(['/apps/web']);
  });

  // A file sitting next to the package directories is not a workspace.
  it('files are not workspaces', () => {
    expect(expandWorkspacePattern(vfs, 'packages/*')).not.toContain(
      '/packages/loose.txt',
    );
  });

  it('a pattern matching nothing gives nothing', () => {
    expect(expandWorkspacePattern(vfs, 'nope/*')).toEqual([]);
    expect(expandWorkspacePattern(vfs, 'nope')).toEqual([]);
  });
});
