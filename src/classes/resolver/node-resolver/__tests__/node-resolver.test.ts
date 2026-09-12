import { describe, expect, it } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

const files = {
  '/node_modules/p/package.json': JSON.stringify({
    name: 'p',
    exports: { '.': { browser: './b.js', import: './esm.js' } },
  }),
  '/node_modules/p/b.js': 'x',
  '/node_modules/p/esm.js': 'y',
  '/src/main.ts': 'x',
};

describe('NodeResolver', () => {
  it('resolves through the browser condition by default', () => {
    const resolver = new NodeResolver({ vfs: new MemoryVfs({ files }) });

    expect(resolver.resolve({ specifier: 'p', importer: '/src/main.ts' })).toEqual({
      kind: 'file',
      path: '/node_modules/p/b.js',
    });
  });

  it('configurable conditions change the target', () => {
    const resolver = new NodeResolver({
      vfs: new MemoryVfs({ files }),
      conditions: ['import', 'default'],
    });

    expect(resolver.resolve({ specifier: 'p', importer: '/src/main.ts' })).toEqual({
      kind: 'file',
      path: '/node_modules/p/esm.js',
    });
  });

  // The cache exists so a build does not reread the same package.json hundreds of times,
  // which is exactly why it has to be dropped when the VFS changes between builds.
  it('invalidate makes a package installed afterwards visible', () => {
    const vfs = new MemoryVfs({ files: { '/src/main.ts': 'x' } });
    const resolver = new NodeResolver({ vfs });

    expect(() =>
      resolver.resolve({ specifier: 'late', importer: '/src/main.ts' }),
    ).toThrow();

    vfs.writeFile('/node_modules/late/package.json', JSON.stringify({ name: 'late' }));
    vfs.writeFile('/node_modules/late/index.js', 'x');
    resolver.invalidate();

    expect(resolver.resolve({ specifier: 'late', importer: '/src/main.ts' })).toEqual({
      kind: 'file',
      path: '/node_modules/late/index.js',
    });
  });
});

describe('NodeResolver, tsconfig paths', () => {
  const files = {
    '/tsconfig.json': '{"compilerOptions":{"paths":{"@/*":["src/*"]}}}',
    '/src/main.tsx': 'x',
    '/src/lib/util.ts': 'x',
  };

  it('reads the aliases out of the tsconfig in the VFS', () => {
    const resolver = new NodeResolver({ vfs: new MemoryVfs({ files }) });

    expect(
      resolver.resolve({ specifier: '@/lib/util', importer: '/src/main.tsx' }),
    ).toEqual({
      kind: 'file',
      path: '/src/lib/util.ts',
    });
  });

  // The tsconfig can be written after the first build, like any other file.
  it('invalidate picks up a tsconfig added later', () => {
    const vfs = new MemoryVfs({
      files: { '/src/main.tsx': 'x', '/src/lib/util.ts': 'x' },
    });
    const resolver = new NodeResolver({ vfs });

    expect(() =>
      resolver.resolve({ specifier: '@/lib/util', importer: '/src/main.tsx' }),
    ).toThrow();

    vfs.writeFile('/tsconfig.json', files['/tsconfig.json']);
    resolver.invalidate();

    expect(
      resolver.resolve({ specifier: '@/lib/util', importer: '/src/main.tsx' }),
    ).toEqual({
      kind: 'file',
      path: '/src/lib/util.ts',
    });
  });
});
