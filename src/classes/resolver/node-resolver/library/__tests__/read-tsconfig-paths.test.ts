import { describe, expect, it } from 'vitest';
import { readTsconfigPaths } from '@/classes/resolver/node-resolver/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

function vfsWith(tsconfig: string): MemoryVfs {
  return new MemoryVfs({ files: { '/tsconfig.json': tsconfig } });
}

describe('readTsconfigPaths', () => {
  it('splits a wildcard pattern around its star', () => {
    const vfs = vfsWith('{"compilerOptions":{"paths":{"@/*":["src/*"]}}}');

    expect(readTsconfigPaths(vfs)).toEqual([
      { prefix: '@/', suffix: '', targets: ['/src'] },
    ]);
  });

  it('resolves targets against baseUrl', () => {
    const vfs = vfsWith(
      '{"compilerOptions":{"baseUrl":"./app","paths":{"~/*":["lib/*"]}}}',
    );

    expect(readTsconfigPaths(vfs)[0]?.targets).toEqual(['/app/lib']);
  });

  it('keeps an exact pattern with no star', () => {
    const vfs = vfsWith('{"compilerOptions":{"paths":{"config":["src/config.ts"]}}}');

    expect(readTsconfigPaths(vfs)).toEqual([
      { prefix: 'config', suffix: '', targets: ['/src/config.ts'] },
    ]);
  });

  // TypeScript picks the longest matching prefix, so the order has to carry that.
  it('sorts the longest prefix first', () => {
    const vfs = vfsWith(
      '{"compilerOptions":{"paths":{"@/*":["src/*"],"@/ui/*":["ui/*"]}}}',
    );

    expect(readTsconfigPaths(vfs).map((m) => m.prefix)).toEqual(['@/ui/', '@/']);
  });

  it('reads a tsconfig with comments', () => {
    const vfs = vfsWith(
      '{\n // paths\n "compilerOptions": { "paths": { "@/*": ["src/*"] } },\n}',
    );

    expect(readTsconfigPaths(vfs)).toHaveLength(1);
  });

  it('no tsconfig, no paths, or broken json all give nothing', () => {
    expect(readTsconfigPaths(new MemoryVfs())).toEqual([]);
    expect(readTsconfigPaths(vfsWith('{"compilerOptions":{}}'))).toEqual([]);
    expect(readTsconfigPaths(vfsWith('{ nope'))).toEqual([]);
  });
});
