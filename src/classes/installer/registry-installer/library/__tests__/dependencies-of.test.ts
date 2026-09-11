import { describe, expect, it } from 'vitest';
import { dependenciesOf } from '@/classes/installer/registry-installer/library/index.js';

const dist = { tarball: 'x' };

describe('dependenciesOf', () => {
  it('turns dependencies into requests parented at the install directory', () => {
    expect(
      dependenciesOf(
        { version: '1.0.0', dependencies: { b: '^2.0.0' }, dist },
        '/node_modules/a',
      ),
    ).toEqual([{ name: 'b', range: '^2.0.0', parentDir: '/node_modules/a' }]);
  });

  it('a version with no dependencies gives no requests', () => {
    expect(dependenciesOf({ version: '1.0.0', dist }, '/node_modules/a')).toEqual([]);
  });

  // Peers are warned about, never walked.
  it('ignores peerDependencies', () => {
    expect(
      dependenciesOf(
        { version: '1.0.0', peerDependencies: { react: '^19.0.0' }, dist },
        '/node_modules/a',
      ),
    ).toEqual([]);
  });
});
