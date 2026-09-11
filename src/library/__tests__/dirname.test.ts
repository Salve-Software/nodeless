import { describe, expect, it } from 'vitest';
import { dirname } from '@/library/index.js';

describe('dirname', () => {
  it('gives the directory holding the file', () => {
    expect(dirname('/src/lib/x.ts')).toBe('/src/lib');
  });

  it('a file at the root gives the root', () => {
    expect(dirname('/package.json')).toBe('/');
  });

  it('the root gives the root', () => {
    expect(dirname('/')).toBe('/');
  });
});
