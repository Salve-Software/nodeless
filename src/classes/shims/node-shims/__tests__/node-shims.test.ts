import type { ShimModule } from '@/classes/shims/index.js';
import { describe, expect, it } from 'vitest';
import { NodeShims } from '@/classes/shims/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

type Call = (...args: unknown[]) => unknown;

function shimsFor(files: Record<string, string> = {}): NodeShims {
  return new NodeShims({ vfs: new MemoryVfs({ files }), cwd: '/project' });
}

function call(module: ShimModule | undefined, name: string): Call {
  return module?.[name] as Call;
}

describe('the fs shim', () => {
  const files = { '/project/a.txt': 'hello' };

  it('reads a file as a Buffer without an encoding and as a string with one', () => {
    const fs = shimsFor(files).get('fs');

    expect(call(fs, 'readFileSync')('/project/a.txt')).toBeInstanceOf(Uint8Array);
    expect(call(fs, 'readFileSync')('/project/a.txt', 'utf8')).toBe('hello');
  });

  it('resolves a relative path against the working directory', () => {
    expect(call(shimsFor(files).get('fs'), 'readFileSync')('a.txt', 'utf8')).toBe(
      'hello',
    );
  });

  it('accepts a file URL, which is what import.meta.url gives a plugin', () => {
    const read = call(shimsFor(files).get('fs'), 'readFileSync');

    expect(read(new URL('file:///project/a.txt'), 'utf8')).toBe('hello');
  });

  it('throws ENOENT with a code, because packages branch on it', () => {
    expect(() => call(shimsFor().get('fs'), 'readFileSync')('/nope')).toThrowError(
      expect.objectContaining({ code: 'ENOENT' }),
    );
  });

  it('returns undefined from statSync when asked not to throw', () => {
    expect(
      call(shimsFor().get('fs'), 'statSync')('/nope', { throwIfNoEntry: false }),
    ).toBe(undefined);
  });

  it('exposes every sync call as a promise under fs/promises', async () => {
    const readFile = call(shimsFor(files).get('fs/promises'), 'readFile');

    await expect(readFile('/project/a.txt', 'utf8')).resolves.toBe('hello');
  });

  it('reports directory entries with types', () => {
    const fs = shimsFor({ '/project/src/a.ts': '', '/project/src/b/c.ts': '' }).get('fs');
    const entries = call(fs, 'readdirSync')('/project/src', { withFileTypes: true }) as {
      name: string;
      isDirectory: () => boolean;
    }[];

    expect(entries.map((entry) => [entry.name, entry.isDirectory()])).toEqual([
      ['a.ts', false],
      ['b', true],
    ]);
  });

  it('writes through to the VFS', () => {
    const vfs = new MemoryVfs();

    call(new NodeShims({ vfs, cwd: '/project' }).get('fs'), 'writeFileSync')(
      'out.txt',
      'written',
    );

    expect(vfs.readText('/project/out.txt')).toBe('written');
  });
});

describe('the process shim', () => {
  it('reports a platform that is true on both sides', () => {
    expect(shimsFor().get('process')?.['platform']).toBe('browser');
  });

  it('moves the working directory, and path.resolve follows', () => {
    const shims = shimsFor();

    call(shims.get('process'), 'chdir')('/elsewhere');

    expect(call(shims.get('path'), 'resolve')('a')).toBe('/elsewhere/a');
  });
});

describe('the unsupported builtins', () => {
  it('lets an import through and throws only when something is called', () => {
    const childProcess = shimsFor().get('child_process');

    expect(childProcess).toBeDefined();
    expect(() => call(childProcess, 'execSync')('ls')).toThrowError(/in-process/);
  });
});

describe('the module shim', () => {
  it('reports a builtin with and without the node: prefix', () => {
    const isBuiltin = call(shimsFor().get('module'), 'isBuiltin');

    expect(isBuiltin('fs')).toBe(true);
    expect(isBuiltin('node:fs')).toBe(true);
    expect(isBuiltin('react')).toBe(false);
  });
});

describe('the crypto shim', () => {
  it('hashes synchronously, which WebCrypto cannot do', () => {
    const hash = call(shimsFor().get('crypto'), 'createHash')('sha256') as ShimModule;

    expect(call(call(hash, 'update')('abc') as ShimModule, 'digest')('hex')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('says which algorithm is missing instead of returning a wrong digest', () => {
    expect(() => call(shimsFor().get('crypto'), 'createHash')('md5')).toThrowError(/md5/);
  });
});

describe('lookup', () => {
  it('strips the node: prefix', () => {
    expect(shimsFor().has('node:path')).toBe(true);
    expect(shimsFor().has('path')).toBe(true);
    expect(shimsFor().has('react')).toBe(false);
  });
});
