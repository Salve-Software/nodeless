import { describe, expect, it } from 'vitest';
import { planInstallDir } from '@/classes/installer/registry-installer/library/index.js';

const request = { name: 'dep', range: '^1.0.0', parentDir: '/node_modules/host' };

describe('planInstallDir', () => {
  it('claims the root node_modules when it is free', () => {
    const rootVersions = new Map<string, string>();

    expect(planInstallDir(rootVersions, { request, version: '1.2.0' })).toBe(
      '/node_modules/dep',
    );
    expect(rootVersions.get('dep')).toBe('1.2.0');
  });

  // Already satisfied means its own dependencies were walked too — walking again would loop.
  it('skips when the root copy already satisfies the range', () => {
    expect(
      planInstallDir(new Map([['dep', '1.5.0']]), { request, version: '1.5.0' }),
    ).toBeUndefined();
  });

  it('nests under the dependent when the root copy conflicts', () => {
    expect(
      planInstallDir(new Map([['dep', '2.0.0']]), { request, version: '1.2.0' }),
    ).toBe('/node_modules/host/node_modules/dep');
  });

  it('an empty range is treated as any version', () => {
    expect(
      planInstallDir(new Map([['dep', '3.0.0']]), {
        request: { ...request, range: '' },
        version: '3.0.0',
      }),
    ).toBeUndefined();
  });
});
