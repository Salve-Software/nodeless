import { describe, expect, it } from 'vitest';
import { buildTarball } from '@/classes/installer/registry-installer/__tests__/tarball.js';
import { extractTarball } from '@/classes/installer/registry-installer/library/index.js';
import { bytesToText } from '@/library/index.js';

describe('extractTarball', () => {
  it('gunzips, untars and strips the root in one step', () => {
    const files = extractTarball(
      buildTarball([
        { name: 'package/package.json', body: '{"name":"p","version":"1.0.0"}' },
        { name: 'package/index.js', body: 'module.exports = 1;' },
      ]),
    );

    expect(Object.keys(files).sort()).toEqual(['index.js', 'package.json']);
    expect(bytesToText(files['package.json'] ?? new Uint8Array())).toContain(
      '"name":"p"',
    );
  });
});
