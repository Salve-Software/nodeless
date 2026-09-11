import { describe, expect, it } from 'vitest';
import { stripRootDir } from '@/classes/installer/registry-installer/library/index.js';
import { textToBytes } from '@/library/index.js';

function map(paths: string[]): Record<string, Uint8Array> {
  return Object.fromEntries(paths.map((path) => [path, textToBytes('x')]));
}

describe('stripRootDir', () => {
  it('drops the package/ prefix npm always adds', () => {
    expect(
      Object.keys(stripRootDir(map(['package/index.js', 'package/lib/a.js']))),
    ).toEqual(['index.js', 'lib/a.js']);
  });

  // Very old tarballs root at the package name instead of `package`.
  it('drops any single shared root', () => {
    expect(Object.keys(stripRootDir(map(['react/index.js'])))).toEqual(['index.js']);
  });

  it('leaves the files alone when there is no single root', () => {
    const files = map(['a/x.js', 'b/y.js']);

    expect(stripRootDir(files)).toBe(files);
  });

  it('drops an entry that is only the root itself', () => {
    expect(Object.keys(stripRootDir(map(['package', 'package/a.js'])))).toEqual(['a.js']);
  });
});
