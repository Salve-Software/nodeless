import type {
  FsReadOptions,
  ShimModule,
} from '@/classes/shims/node-shims/types/index.js';
import type { Vfs } from '@/types/index.js';
import { fromBuffer } from '@/classes/shims/nodeless-buffer/index.js';
import { createDirent } from './create-dirent.js';
import { createNodeError } from './create-node-error.js';
import { createStats } from './create-stats.js';
import { isWithFileTypes } from './is-with-file-types.js';
import { readEncoding } from './read-encoding.js';
import { toFsPromises } from './to-fs-promises.js';

/** `node:fs` over the VFS. There is no disk to escape to, which is what makes this a sandbox. */
export function createFsShim({
  vfs,
  toPath,
}: {
  vfs: Vfs;
  toPath: (path: unknown) => string;
}): ShimModule {
  const readFileSync = (path: unknown, options?: FsReadOptions): unknown => {
    const target = toPath(path);
    const bytes = vfs.tryReadFile(target);

    if (!bytes) throw createNodeError('ENOENT', { syscall: 'open', path: target });

    return readEncoding(options) === undefined ? fromBuffer(bytes) : vfs.readText(target);
  };

  const statSync = (path: unknown, options?: FsReadOptions): unknown => {
    const target = toPath(path);
    const stat = vfs.stat(target);

    if (stat) return createStats(stat);
    if (typeof options === 'object' && options?.throwIfNoEntry === false)
      return undefined;

    throw createNodeError('ENOENT', { syscall: 'stat', path: target });
  };

  const readdirSync = (path: unknown, options?: FsReadOptions): unknown[] => {
    const target = toPath(path);
    const names = vfs.readdir(target);

    if (!isWithFileTypes(options)) return names;

    return names.map((name) => createDirent(vfs, { dir: target, name }));
  };

  const shim: ShimModule = {
    readFileSync,
    statSync,
    lstatSync: statSync,
    readdirSync,
    writeFileSync: (path: unknown, content: string | Uint8Array) => {
      vfs.writeFile(toPath(path), content);
    },
    existsSync: (path: unknown) => vfs.exists(toPath(path)),
    appendFileSync: (path: unknown, content: string) => {
      const target = toPath(path);
      const current = vfs.exists(target) ? vfs.readText(target) : '';

      vfs.writeFile(target, `${current}${content}`);
    },
    mkdirSync: (path: unknown) => {
      vfs.mkdir(toPath(path));
    },
    rmSync: (path: unknown, options?: { recursive?: boolean }) => {
      vfs.rm(toPath(path), { recursive: options?.recursive ?? false });
    },
    rmdirSync: (path: unknown) => {
      vfs.rm(toPath(path), { recursive: true });
    },
    unlinkSync: (path: unknown) => {
      vfs.rm(toPath(path));
    },
    copyFileSync: (from: unknown, to: unknown) => {
      vfs.writeFile(toPath(to), vfs.readFile(toPath(from)));
    },
    renameSync: (from: unknown, to: unknown) => {
      const source = toPath(from);

      vfs.writeFile(toPath(to), vfs.readFile(source));
      vfs.rm(source);
    },
    accessSync: (path: unknown) => {
      const target = toPath(path);

      if (!vfs.exists(target)) {
        throw createNodeError('ENOENT', { syscall: 'access', path: target });
      }
    },
    // The VFS has no symlinks, so every path is already its own real path.
    realpathSync: Object.assign((path: unknown) => toPath(path), {
      native: (path: unknown) => toPath(path),
    }),
    readlinkSync: (path: unknown) => {
      throw createNodeError('EINVAL', { syscall: 'readlink', path: toPath(path) });
    },
    watch: () => ({ close: () => undefined, on: () => undefined }),
    watchFile: () => undefined,
    unwatchFile: () => undefined,
    constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 },
  };

  shim['promises'] = toFsPromises(shim);
  shim['default'] = shim;

  return shim;
}
