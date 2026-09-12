import { describe, expect, it } from 'vitest';
import { unwrapEsbuild } from '@/library/index.js';

const api = { build: () => undefined, initialize: () => undefined };

describe('unwrapEsbuild', () => {
  it('a real namespace is used as it is', () => {
    expect(unwrapEsbuild(api)).toBe(api);
  });

  // esm.sh serves esbuild-wasm through a CJS shim that only exports `default`,
  // so `import * as esbuild` gives an object with no `build` on it.
  it('a CJS shim is unwrapped through default', () => {
    expect(unwrapEsbuild({ default: api })).toBe(api);
  });

  it('a namespace carrying both prefers the real one', () => {
    const both = { ...api, default: { build: () => 'wrong' } };

    expect(unwrapEsbuild(both)).toBe(both);
  });

  it('something unrecognisable is passed through rather than crashing here', () => {
    const odd = { nothing: true };

    expect(unwrapEsbuild(odd)).toBe(odd);
  });
});
