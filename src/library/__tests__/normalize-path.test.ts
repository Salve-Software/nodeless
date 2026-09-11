import { describe, expect, it } from 'vitest';
import { normalizePath } from '@/library/index.js';

describe('normalizePath', () => {
  it('turns a relative path absolute from the root', () => {
    expect(normalizePath('src/main.tsx')).toBe('/src/main.tsx');
  });

  it('collapses repeated slashes and empty segments', () => {
    expect(normalizePath('//src///main.tsx')).toBe('/src/main.tsx');
  });

  it('resolves dot and dot-dot', () => {
    expect(normalizePath('/src/./lib/../main.tsx')).toBe('/src/main.tsx');
  });

  it('never escapes the root by walking up too far', () => {
    expect(normalizePath('/../../etc')).toBe('/etc');
  });

  it('an empty path and the root both give the root', () => {
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('/')).toBe('/');
  });

  it('drops the trailing slash', () => {
    expect(normalizePath('/node_modules/react/')).toBe('/node_modules/react');
  });
});
