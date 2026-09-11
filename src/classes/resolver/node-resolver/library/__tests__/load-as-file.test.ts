import { describe, expect, it } from 'vitest';
import { createScope } from '@/classes/resolver/node-resolver/__tests__/scope.js';
import { loadAsFile } from '@/classes/resolver/node-resolver/library/index.js';

describe('loadAsFile', () => {
  it('an exact path beats any extension', () => {
    const scope = createScope({ '/src/App': 'x', '/src/App.tsx': 'y' });

    expect(loadAsFile(scope, '/src/App')).toBe('/src/App');
  });

  it('tries extensions in order, TSX before JS', () => {
    const scope = createScope({ '/src/App.js': 'x', '/src/App.tsx': 'y' });

    expect(loadAsFile(scope, '/src/App')).toBe('/src/App.tsx');
  });

  // In ESM, TypeScript tells you to write `./x.js` for a file named `./x.ts`.
  it('rewrites .js to .ts when only the .ts exists', () => {
    const scope = createScope({ '/src/x.ts': 'x' });

    expect(loadAsFile(scope, '/src/x.js')).toBe('/src/x.ts');
  });

  it('rewrites .js to .tsx', () => {
    const scope = createScope({ '/src/App.tsx': 'x' });

    expect(loadAsFile(scope, '/src/App.js')).toBe('/src/App.tsx');
  });

  it('a real .js beats the rewrite', () => {
    const scope = createScope({ '/src/x.js': 'a', '/src/x.ts': 'b' });

    expect(loadAsFile(scope, '/src/x.js')).toBe('/src/x.js');
  });

  it('a directory is not a file', () => {
    const scope = createScope({ '/src/lib/x.ts': 'a' });

    expect(loadAsFile(scope, '/src/lib')).toBeUndefined();
  });

  it('no candidate gives undefined', () => {
    expect(loadAsFile(createScope({}), '/src/nope')).toBeUndefined();
  });
});
