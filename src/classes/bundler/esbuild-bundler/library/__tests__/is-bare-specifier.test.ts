import { describe, expect, it } from 'vitest';
import { isBareSpecifier } from '@/classes/bundler/esbuild-bundler/library/index.js';

describe('isBareSpecifier', () => {
  it('a package name is bare', () => {
    expect(isBareSpecifier('react')).toBe(true);
    expect(isBareSpecifier('@scope/pkg/sub')).toBe(true);
  });

  it('a path is not', () => {
    expect(isBareSpecifier('./App.tsx')).toBe(false);
    expect(isBareSpecifier('../lib/x.js')).toBe(false);
    expect(isBareSpecifier('/src/main.tsx')).toBe(false);
  });
});
