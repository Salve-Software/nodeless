import type { ParsedPath, ShimModule } from '@/classes/shims/node-shims/types/index.js';
import { posixBasename } from './posix-basename.js';
import { posixDirname } from './posix-dirname.js';
import { posixExtname } from './posix-extname.js';
import { posixFormat } from './posix-format.js';
import { posixJoin } from './posix-join.js';
import { posixNormalize } from './posix-normalize.js';
import { posixParse } from './posix-parse.js';
import { posixRelative } from './posix-relative.js';
import { posixResolve } from './posix-resolve.js';

/** `win32` is the POSIX implementation: there is one filesystem here and it is POSIX. */
export function createPathShim(cwd: () => string): ShimModule {
  const shim: ShimModule = {
    sep: '/',
    delimiter: ':',
    normalize: (path: string) => posixNormalize(path),
    join: (...paths: string[]) => posixJoin(paths),
    resolve: (...paths: string[]) => posixResolve(paths, cwd()),
    relative: (from: string, to: string) => posixRelative({ from, to, cwd: cwd() }),
    dirname: (path: string) => posixDirname(path),
    basename: (path: string, suffix?: string) => posixBasename(path, suffix),
    extname: (path: string) => posixExtname(path),
    parse: (path: string) => posixParse(path),
    format: (parsed: Partial<ParsedPath>) => posixFormat(parsed),
    isAbsolute: (path: string) => path.startsWith('/'),
    toNamespacedPath: (path: string) => path,
    matchesGlob: () => false,
  };

  shim['posix'] = shim;
  shim['win32'] = shim;
  shim['default'] = shim;

  return shim;
}
