import { describe, expect, it } from 'vitest';
import { joinPath } from '@/library/index.js';

describe('joinPath', () => {
  it('joins a directory with a relative path', () => {
    expect(joinPath('/src', './App.tsx')).toBe('/src/App.tsx');
  });

  it('walks up with dot-dot', () => {
    expect(joinPath('/src/pages', '../App.tsx')).toBe('/src/App.tsx');
  });

  it('joins from the root', () => {
    expect(joinPath('/', 'node_modules')).toBe('/node_modules');
  });
});
