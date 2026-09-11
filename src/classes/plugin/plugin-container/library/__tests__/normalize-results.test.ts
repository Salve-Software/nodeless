import { describe, expect, it } from 'vitest';
import { normalizeCodeResult, normalizeResolveResult } from '@/classes/plugin/index.js';

describe('normalizeResolveResult', () => {
  it('treats a bare string as a local id', () => {
    expect(normalizeResolveResult('/a.ts')).toEqual({ id: '/a.ts', external: false });
  });

  it('carries external through', () => {
    expect(normalizeResolveResult({ id: 'react', external: true })).toEqual({
      id: 'react',
      external: true,
    });
  });

  it('turns null into "not mine" rather than into an id', () => {
    expect(normalizeResolveResult(null)).toBeUndefined();
    expect(normalizeResolveResult(undefined)).toBeUndefined();
  });
});

describe('normalizeCodeResult', () => {
  it('accepts a bare string', () => {
    expect(normalizeCodeResult('x')).toEqual({ code: 'x' });
  });

  it('keeps an explicit loader', () => {
    expect(normalizeCodeResult({ code: 'x', loader: 'css' })).toEqual({
      code: 'x',
      loader: 'css',
    });
  });

  it('drops the sourcemap, which esbuild has no channel for', () => {
    expect(normalizeCodeResult({ code: 'x', map: { version: 3 } })).toEqual({
      code: 'x',
    });
  });
});
