import { describe, expect, it } from 'vitest';
import { basename } from '@/library/index.js';

describe('basename', () => {
  it('gives the last segment', () => {
    expect(basename('/node_modules/react/index.js')).toBe('index.js');
  });

  it('ignores a trailing slash', () => {
    expect(basename('/node_modules/react/')).toBe('react');
  });

  it('the root has no name', () => {
    expect(basename('/')).toBe('');
  });
});
