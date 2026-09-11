import type { Packument } from '@/classes/installer/registry-installer/types/index.js';
import { describe, expect, it } from 'vitest';
import { pickVersion } from '@/classes/installer/registry-installer/library/index.js';
import { InstallError } from '@/errors/index.js';

function packument(versions: string[], tags: Record<string, string> = {}): Packument {
  return {
    name: 'p',
    'dist-tags': { latest: versions.at(-1) ?? '0.0.0', ...tags },
    versions: Object.fromEntries(
      versions.map((version) => [version, { version, dist: { tarball: 'x' } }]),
    ),
  };
}

describe('pickVersion', () => {
  it('takes the highest version the range allows', () => {
    expect(pickVersion(packument(['1.0.0', '1.9.9', '2.0.0']), '^1.0.0').version).toBe(
      '1.9.9',
    );
  });

  it('an exact range takes that version', () => {
    expect(pickVersion(packument(['1.0.0', '2.0.0']), '1.0.0').version).toBe('1.0.0');
  });

  it('an empty range takes the highest of all', () => {
    expect(pickVersion(packument(['1.0.0', '3.0.0']), '').version).toBe('3.0.0');
  });

  // A prerelease only matches a range that asks for one; `^1.0.0` must not pick 2.0.0-beta.
  it('a prerelease is not picked by a plain range', () => {
    expect(pickVersion(packument(['1.0.0', '2.0.0-beta.1']), '^1.0.0').version).toBe(
      '1.0.0',
    );
  });

  it('a dist-tag resolves through dist-tags', () => {
    expect(
      pickVersion(packument(['1.0.0', '2.0.0'], { next: '1.0.0' }), 'next').version,
    ).toBe('1.0.0');
  });

  it('a range nothing satisfies fails with the package name', () => {
    expect(() => pickVersion(packument(['1.0.0']), '^9.0.0')).toThrow(/"p"/);
  });

  // `npm:`, `file:` and `git+https:` mean something other than the registry.
  it('a non-registry protocol is refused, not guessed', () => {
    expect(() => pickVersion(packument(['1.0.0']), 'npm:other@^1.0.0')).toThrow(
      InstallError,
    );
    expect(() => pickVersion(packument(['1.0.0']), 'file:../local')).toThrow(
      /Only registry ranges/,
    );
  });
});
