import { describe, expect, it } from 'vitest';
import { buildTar } from '@/classes/installer/registry-installer/__tests__/tarball.js';
import { untar } from '@/classes/installer/registry-installer/library/index.js';
import { bytesToText, textToBytes } from '@/library/index.js';

function names(tar: Uint8Array): string[] {
  return Object.keys(untar(tar)).sort();
}

describe('untar', () => {
  it('reads a file and its contents', () => {
    const files = untar(
      buildTar([{ name: 'package/index.js', body: 'export const x = 1;' }]),
    );

    expect(bytesToText(files['package/index.js'] ?? new Uint8Array())).toBe(
      'export const x = 1;',
    );
  });

  it('reads a body that spans more than one block', () => {
    const body = 'a'.repeat(1500);
    const files = untar(buildTar([{ name: 'package/big.js', body }]));

    expect(files['package/big.js']).toEqual(textToBytes(body));
  });

  it('reads several entries in order', () => {
    expect(
      names(
        buildTar([
          { name: 'package/package.json', body: '{}' },
          { name: 'package/lib/a.js', body: 'a' },
        ]),
      ),
    ).toEqual(['package/lib/a.js', 'package/package.json']);
  });

  // Directory and link entries carry no content and would show up as empty files.
  it('drops directory entries', () => {
    expect(
      names(
        buildTar([
          { name: 'package/lib/', typeFlag: '5' },
          { name: 'package/a.js', body: 'a' },
        ]),
      ),
    ).toEqual(['package/a.js']);
  });

  // A path longer than 100 bytes is split across the prefix and name fields.
  it('joins the prefix field back onto the name', () => {
    expect(
      names(buildTar([{ prefix: 'package/deeply/nested', name: 'file.js', body: 'x' }])),
    ).toEqual(['package/deeply/nested/file.js']);
  });

  // node-tar emits a pax record when the path does not fit the ustar header at all.
  it('takes the path from a pax extended header', () => {
    const path = `package/${'x'.repeat(120)}.js`;
    const record = `${String(path.length + 8)} path=${path}\n`;

    expect(
      names(
        buildTar([
          { name: 'PaxHeader', typeFlag: 'x', body: record },
          { name: 'package/truncated.js', body: 'x' },
        ]),
      ),
    ).toEqual([path]);
  });

  it('stops at the zero block and ignores trailing padding', () => {
    const tar = buildTar([{ name: 'package/a.js', body: 'a' }]);
    const padded = new Uint8Array(tar.length + 1024);

    padded.set(tar);

    expect(names(padded)).toEqual(['package/a.js']);
  });

  it('an empty archive gives no files', () => {
    expect(untar(buildTar([]))).toEqual({});
  });
});
