import { describe, expect, it } from 'vitest';
import { nodeModulesDirs } from '@/classes/resolver/node-resolver/library/index.js';

describe('nodeModulesDirs', () => {
  it('runs from the nearest directory up to the root', () => {
    expect(nodeModulesDirs('/src/pages')).toEqual([
      '/src/pages/node_modules',
      '/src/node_modules',
      '/node_modules',
    ]);
  });

  it('the root gives only the root node_modules', () => {
    expect(nodeModulesDirs('/')).toEqual(['/node_modules']);
  });

  // Inside a package, `node_modules/react/node_modules` is the valid nested one;
  // `node_modules/node_modules` does not exist and would be a wasted lookup.
  it('never proposes node_modules inside node_modules', () => {
    expect(nodeModulesDirs('/node_modules/react/lib')).toEqual([
      '/node_modules/react/lib/node_modules',
      '/node_modules/react/node_modules',
      '/node_modules',
    ]);
  });
});
