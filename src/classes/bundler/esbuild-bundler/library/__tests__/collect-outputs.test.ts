import type { OutputFile } from 'esbuild-wasm';
import { describe, expect, it } from 'vitest';
import { collectOutputs } from '@/classes/bundler/esbuild-bundler/library/index.js';

function outputFile(path: string): OutputFile {
  return { path, contents: new Uint8Array([1]), text: '', hash: '' };
}

describe('collectOutputs', () => {
  it('strips the outdir prefix off the keys', () => {
    expect(Object.keys(collectOutputs([outputFile('/dist/bundle.js')], '/dist'))).toEqual(
      ['bundle.js'],
    );
  });

  it('keeps a subfolder inside the outdir', () => {
    expect(
      Object.keys(collectOutputs([outputFile('/dist/assets/logo.svg')], '/dist')),
    ).toEqual(['assets/logo.svg']);
  });

  // An asset on the `file` loader can land outside the outdir, and still has to show up.
  it('a file outside the outdir comes in under its name', () => {
    expect(Object.keys(collectOutputs([outputFile('/other/logo.svg')], '/dist'))).toEqual(
      ['logo.svg'],
    );
  });

  it('an empty list gives an empty object', () => {
    expect(collectOutputs([], '/dist')).toEqual({});
  });
});
