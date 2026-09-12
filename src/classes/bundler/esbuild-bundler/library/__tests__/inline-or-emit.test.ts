import { describe, expect, it } from 'vitest';
import { inlineOrEmit } from '@/classes/bundler/esbuild-bundler/library/index.js';

describe('inlineOrEmit', () => {
  it('a small asset stays a data URL', () => {
    expect(inlineOrEmit('dataurl', { size: 100, limit: 4096 })).toBe('dataurl');
  });

  // A 2 MB image base64'd into the bundle costs a third more and cannot be cached apart.
  it('a large asset becomes its own file', () => {
    expect(inlineOrEmit('dataurl', { size: 5000, limit: 4096 })).toBe('file');
  });

  it('exactly at the limit still inlines', () => {
    expect(inlineOrEmit('dataurl', { size: 4096, limit: 4096 })).toBe('dataurl');
  });

  it('a limit of zero emits everything', () => {
    expect(inlineOrEmit('dataurl', { size: 1, limit: 0 })).toBe('file');
  });

  it('leaves every other loader alone', () => {
    expect(inlineOrEmit('tsx', { size: 999_999, limit: 10 })).toBe('tsx');
    expect(inlineOrEmit('css', { size: 999_999, limit: 10 })).toBe('css');
  });
});
