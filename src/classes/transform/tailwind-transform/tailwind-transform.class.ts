import type {
  TailwindApi,
  TailwindStylesheet,
  TailwindTransformOptions,
} from './types/index.js';
import type {
  SourceTransform,
  TransformInput,
  TransformResult,
  Vfs,
} from '@/types/index.js';
import { loadPeer } from '@/classes/transform/library/index.js';
import { dirname, joinPath } from '@/library/index.js';
import { TAILWIND_MARKERS, TAILWIND_PACKAGE } from './constants/index.js';
import { collectCandidates } from './library/index.js';

/** Compiles a stylesheet that uses Tailwind directives. Plain CSS never reaches it. */
export class TailwindTransform implements SourceTransform {
  readonly name = 'tailwind';
  readonly stage = 'content' as const;
  private readonly tailwind: TailwindApi | undefined;

  constructor({ tailwind }: TailwindTransformOptions = {}) {
    this.tailwind = tailwind;
  }

  matches({ content }: { path: string; content: string }): boolean {
    return TAILWIND_MARKERS.test(content);
  }

  async apply({ path, content, vfs, resolve }: TransformInput): Promise<TransformResult> {
    const tailwind = this.tailwind ?? (await this.load());
    const compiler = await tailwind.compile(content, {
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

    return { content: compiler.build(collectCandidates(vfs)), loader: 'css' };
  }

  private async load(): Promise<TailwindApi> {
    return (await loadPeer(
      TAILWIND_PACKAGE,
      'This project uses Tailwind.',
    )) as TailwindApi;
  }
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
