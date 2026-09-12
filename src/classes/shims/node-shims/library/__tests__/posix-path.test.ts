import { describe, expect, it } from 'vitest';
import {
  posixBasename,
  posixDirname,
  posixExtname,
  posixFormat,
  posixJoin,
  posixNormalize,
  posixParse,
  posixRelative,
  posixResolve,
} from '@/classes/shims/node-shims/library/index.js';

describe('posixNormalize', () => {
  it('keeps a relative path relative', () => {
    expect(posixNormalize('a/b/../c')).toBe('a/c');
  });

  it('keeps leading .. on a relative path, because there is no root to clamp to', () => {
    expect(posixNormalize('../a')).toBe('../a');
  });

  it('drops .. that would escape the root', () => {
    expect(posixNormalize('/../a')).toBe('/a');
  });

  it('preserves a trailing slash', () => {
    expect(posixNormalize('/a/b/')).toBe('/a/b/');
  });

  it('turns an empty path into the current directory', () => {
    expect(posixNormalize('')).toBe('.');
  });
});

describe('posixResolve', () => {
  it('stops at the rightmost absolute segment', () => {
    expect(posixResolve(['/a', '/b', 'c'], '/cwd')).toBe('/b/c');
  });

  it('falls back to the working directory when nothing is absolute', () => {
    expect(posixResolve(['a', 'b'], '/cwd')).toBe('/cwd/a/b');
  });

  it('resolves an empty list to the working directory', () => {
    expect(posixResolve([], '/cwd')).toBe('/cwd');
  });
});

describe('posixRelative', () => {
  it('walks up and back down', () => {
    expect(posixRelative({ from: '/a/b', to: '/a/c/d', cwd: '/' })).toBe('../c/d');
  });

  it('is empty between identical paths', () => {
    expect(posixRelative({ from: '/a', to: '/a', cwd: '/' })).toBe('');
  });
});

describe('posixDirname', () => {
  it('is . for a bare name, which is where Node differs from the VFS helper', () => {
    expect(posixDirname('file.ts')).toBe('.');
  });

  it('is / for a path directly under the root', () => {
    expect(posixDirname('/file.ts')).toBe('/');
  });
});

describe('posixBasename', () => {
  it('strips a suffix', () => {
    expect(posixBasename('/a/b.ts', '.ts')).toBe('b');
  });

  it('ignores a trailing slash', () => {
    expect(posixBasename('/a/b/')).toBe('b');
  });

  it('does not strip a suffix that is the whole name', () => {
    expect(posixBasename('/a/.ts', '.ts')).toBe('.ts');
  });
});

describe('posixExtname', () => {
  it('treats a dotfile as a name and not an extension', () => {
    expect(posixExtname('/a/.env')).toBe('');
  });

  it('returns the last extension', () => {
    expect(posixExtname('/a/b.d.ts')).toBe('.ts');
  });
});

describe('posixJoin', () => {
  it('drops empty segments', () => {
    expect(posixJoin(['/a', '', 'b'])).toBe('/a/b');
  });

  it('joins nothing into the current directory', () => {
    expect(posixJoin([])).toBe('.');
  });
});

describe('posixParse and posixFormat', () => {
  it('round trips a path', () => {
    const parsed = posixParse('/a/b/c.tsx');

    expect(parsed).toEqual({
      root: '/',
      dir: '/a/b',
      base: 'c.tsx',
      ext: '.tsx',
      name: 'c',
    });
    expect(posixFormat(parsed)).toBe('/a/b/c.tsx');
  });

  it('formats from name and ext when base is absent', () => {
    expect(posixFormat({ dir: '/a', name: 'b', ext: '.ts' })).toBe('/a/b.ts');
  });
});
