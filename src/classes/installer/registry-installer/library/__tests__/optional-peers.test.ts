import { describe, expect, it } from 'vitest';
import { optionalPeers } from '@/classes/installer/registry-installer/library/index.js';

const dist = { tarball: 'x' };

describe('optionalPeers', () => {
  it('collects the peers marked optional', () => {
    expect(
      optionalPeers({
        version: '1.0.0',
        peerDependenciesMeta: { '@types/react': { optional: true } },
        dist,
      }),
    ).toEqual(new Set(['@types/react']));
  });

  it('leaves a peer that is only listed, not marked', () => {
    expect(
      optionalPeers({
        version: '1.0.0',
        peerDependenciesMeta: { react: {} },
        dist,
      }),
    ).toEqual(new Set());
  });

  it('no meta means no optional peers', () => {
    expect(optionalPeers({ version: '1.0.0', dist })).toEqual(new Set());
  });
});
