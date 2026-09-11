import type { InstalledPackage } from '@/classes/installer/registry-installer/types/index.js';
import { describe, expect, it } from 'vitest';
import { buildLockfile } from '@/classes/installer/registry-installer/library/index.js';

function entry(
  name: string,
  { dir, version = '1.0.0' }: { dir: string; version?: string },
): InstalledPackage {
  return {
    name,
    version,
    dir,
    resolved: `https://registry.test/${name}.tgz`,
    integrity: 'sha512-abc',
    peerDependencies: {},
    optionalPeers: new Set<string>(),
  };
}

describe('buildLockfile', () => {
  it('keys entries by install directory, without the leading slash', () => {
    expect(buildLockfile([entry('p', { dir: '/node_modules/p' })]).packages).toEqual({
      'node_modules/p': {
        version: '1.0.0',
        resolved: 'https://registry.test/p.tgz',
        integrity: 'sha512-abc',
      },
    });
  });

  // A nested copy is a different entry, so the same name can appear twice.
  it('keeps a nested copy separate from the hoisted one', () => {
    expect(
      Object.keys(
        buildLockfile([
          entry('dep', { dir: '/node_modules/dep', version: '2.0.0' }),
          entry('dep', {
            dir: '/node_modules/legacy/node_modules/dep',
            version: '1.0.0',
          }),
        ]).packages,
      ),
    ).toEqual(['node_modules/dep', 'node_modules/legacy/node_modules/dep']);
  });

  it('sorts by directory so the file is stable across runs', () => {
    expect(
      Object.keys(
        buildLockfile([
          entry('z', { dir: '/node_modules/z' }),
          entry('a', { dir: '/node_modules/a' }),
        ]).packages,
      ),
    ).toEqual(['node_modules/a', 'node_modules/z']);
  });

  it('omits integrity when the registry published none', () => {
    const withoutIntegrity = {
      ...entry('p', { dir: '/node_modules/p' }),
      integrity: undefined,
    };

    expect(
      buildLockfile([withoutIntegrity]).packages['node_modules/p'],
    ).not.toHaveProperty('integrity');
  });
});
