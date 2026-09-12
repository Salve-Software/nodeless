import { describe, expect, it } from 'vitest';
import { readWorkspaces } from '@/classes/installer/registry-installer/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

function vfsWith(root: unknown, packages: Record<string, unknown> = {}): MemoryVfs {
  return new MemoryVfs({
    files: {
      '/package.json': JSON.stringify(root),
      ...Object.fromEntries(
        Object.entries(packages).map(([path, manifest]) => [
          path,
          JSON.stringify(manifest),
        ]),
      ),
    },
  });
}

describe('readWorkspaces', () => {
  it('maps each workspace package name to its directory', () => {
    const vfs = vfsWith(
      { workspaces: ['packages/*'] },
      {
        '/packages/types/package.json': { name: '@local/types' },
        '/packages/ui/package.json': { name: '@local/ui' },
      },
    );

    expect(readWorkspaces(vfs)).toEqual(
      new Map([
        ['@local/types', '/packages/types'],
        ['@local/ui', '/packages/ui'],
      ]),
    );
  });

  // yarn and pnpm both allow the object form.
  it('reads the object form too', () => {
    const vfs = vfsWith(
      { workspaces: { packages: ['packages/*'] } },
      {
        '/packages/types/package.json': { name: '@local/types' },
      },
    );

    expect([...readWorkspaces(vfs).keys()]).toEqual(['@local/types']);
  });

  it('a project without workspaces gives nothing', () => {
    expect(readWorkspaces(vfsWith({ name: 'app' })).size).toBe(0);
  });

  it('a workspace directory with no name is skipped', () => {
    const vfs = vfsWith(
      { workspaces: ['packages/*'] },
      {
        '/packages/nameless/package.json': { version: '1.0.0' },
      },
    );

    expect(readWorkspaces(vfs).size).toBe(0);
  });
});
