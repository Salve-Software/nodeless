import { describe, expect, it } from 'vitest';
import { entryNotFound } from '@/classes/bundler/esbuild-bundler/library/index.js';

describe('entryNotFound', () => {
  it('lists the candidates when nothing was asked for', () => {
    expect(entryNotFound(undefined)).toContain('src/main.tsx');
    expect(entryNotFound(undefined)).toContain('pass `entry`');
  });

  it('names the path when one was asked for and is not there', () => {
    expect(entryNotFound('src/app.ts')).toBe(
      'Entry point not found in the virtual filesystem: /src/app.ts',
    );
  });

  it('normalises the path it echoes back', () => {
    expect(entryNotFound('./src/../src/app.ts')).toContain('/src/app.ts');
  });
});
