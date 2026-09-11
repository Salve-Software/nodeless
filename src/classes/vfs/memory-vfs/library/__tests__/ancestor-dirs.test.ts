import { describe, expect, it } from 'vitest';
import { ancestorDirs } from '@/classes/vfs/memory-vfs/library/index.js';

describe('ancestorDirs', () => {
  it('runs from the root down to the path, inclusive', () => {
    expect(ancestorDirs('/node_modules/react/cjs')).toEqual([
      '/',
      '/node_modules',
      '/node_modules/react',
      '/node_modules/react/cjs',
    ]);
  });

  it('the root gives only the root', () => {
    expect(ancestorDirs('/')).toEqual(['/']);
  });
});
