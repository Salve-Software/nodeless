import type {
  TailwindApi,
  TailwindStylesheet,
  TailwindTransformOptions,
} from './types/index.js';
import type { CssTransform, Vfs } from '@/types/index.js';
import { dirname, joinPath } from '@/library/index.js';
import {
  collectCandidates,
  isTailwindStylesheet,
  loadTailwind,
} from './library/index.js';

/** The default `cssTransform`. Plain CSS passes straight through and never loads Tailwind. */
export class TailwindTransform {
  private readonly tailwind: TailwindApi | undefined;

  constructor({ tailwind }: TailwindTransformOptions = {}) {
    this.tailwind = tailwind;
  }

  readonly transform: CssTransform = async ({ path, css, vfs, resolve }) => {
    if (!isTailwindStylesheet(css)) return css;

    const tailwind = this.tailwind ?? (await loadTailwind());
    const compiler = await tailwind.compile(css, {
      base: dirname(path),
      loadStylesheet: async (id, base) =>
        read(vfs, {
          id,
          from: path,
          found: id.startsWith('.') ? joinPath(base, id) : resolve(id),
        }),
      loadModule: (id) => {
        // `@plugin` and `@config` point at JavaScript, and running the project's code is
        // the one thing this library does not do.
        throw new Error(
          `Cannot load "${id}": @plugin and @config would run project code`,
        );
      },
    });

    return compiler.build(collectCandidates(vfs));
  };
}

/**
 * The engine comes from the host, the stylesheets come from the project. Tailwind has to be
 * in the VFS for its own CSS to be readable, which means installing it like any dependency.
 */
async function read(
  vfs: Vfs,
  { id, from, found }: { id: string; from: string; found: string | undefined },
): Promise<TailwindStylesheet> {
  if (found === undefined || !vfs.exists(found)) {
    throw new Error(
      `Cannot find "${id}" imported from ${from}. ` +
        `If it is a devDependency, install it: install({ dev: ['${id}'] })`,
    );
  }

  return { path: found, base: dirname(found), content: vfs.readText(found) };
}
