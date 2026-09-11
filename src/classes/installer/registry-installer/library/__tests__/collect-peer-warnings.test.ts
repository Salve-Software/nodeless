import type { InstalledPackage } from '@/classes/installer/registry-installer/types/index.js';
import { describe, expect, it } from 'vitest';
import { collectPeerWarnings } from '@/classes/installer/registry-installer/library/index.js';

function entry(overrides: Partial<InstalledPackage>): InstalledPackage {
  return {
    name: 'p',
    version: '1.0.0',
    dir: '/node_modules/p',
    resolved: 'x',
    peerDependencies: {},
    ...overrides,
  };
}

describe('collectPeerWarnings', () => {
  it('warns when the peer is missing', () => {
    expect(
      collectPeerWarnings([
        entry({ name: 'plugin', peerDependencies: { react: '^19.0.0' } }),
      ]),
    ).toEqual(['plugin@1.0.0 wants peer react@^19.0.0, which is not installed']);
  });

  it('warns when the installed peer is the wrong version', () => {
    expect(
      collectPeerWarnings([
        entry({ name: 'plugin', peerDependencies: { react: '^19.0.0' } }),
        entry({ name: 'react', version: '18.2.0' }),
      ]),
    ).toEqual(['plugin@1.0.0 wants peer react@^19.0.0, but 18.2.0 is installed']);
  });

  it('stays quiet when the peer is satisfied', () => {
    expect(
      collectPeerWarnings([
        entry({ name: 'plugin', peerDependencies: { react: '^19.0.0' } }),
        entry({ name: 'react', version: '19.1.0' }),
      ]),
    ).toEqual([]);
  });
});
