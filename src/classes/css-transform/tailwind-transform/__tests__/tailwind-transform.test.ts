import type {
  TailwindApi,
  TailwindStylesheet,
} from '@/classes/css-transform/tailwind-transform/types/index.js';
import type { Vfs } from '@/types/index.js';
import { describe, expect, it, vi } from 'vitest';
import { TailwindTransform } from '@/classes/css-transform/index.js';
import { NodeResolver } from '@/classes/resolver/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

const files = {
  '/src/index.css': "@import 'tailwindcss';",
  '/src/App.tsx': '<h1 className="flex">hi</h1>',
  '/node_modules/tailwindcss/package.json':
    '{"name":"tailwindcss","exports":{".":{"style":"./index.css"}}}',
  '/node_modules/tailwindcss/index.css': '@layer utilities;',
};

/** Resolves from the stylesheet the way the bundler does when it calls a cssTransform. */
function resolverFor(vfs: Vfs): (specifier: string) => string | undefined {
  const resolver = new NodeResolver({ vfs });

  return (specifier) => {
    try {
      const found = resolver.resolve({ specifier, importer: '/src/index.css' });

      return found.kind === 'file' ? found.path : undefined;
    } catch {
      return undefined;
    }
  };
}

function fakeTailwind(loaded: string[]): TailwindApi {
  const compile = vi.fn<TailwindApi['compile']>(async (source, options) => {
    const sheet: TailwindStylesheet = await options.loadStylesheet(
      'tailwindcss',
      options.base,
    );

    loaded.push(sheet.path);

    return { build: (candidates) => `/* ${source} | ${candidates.join(' ')} */` };
  });

  return { compile };
}

describe('TailwindTransform', () => {
  it('compiles a Tailwind stylesheet with the candidates from the VFS', async () => {
    const vfs = new MemoryVfs({ files });
    const result = await new TailwindTransform({ tailwind: fakeTailwind([]) }).transform({
      path: '/src/index.css',
      css: "@import 'tailwindcss';",
      vfs,
      resolve: resolverFor(vfs),
    });

    expect(result).toContain('flex');
  });

  // Loading the engine for a stylesheet that never needed it would be waste on every build.
  it('plain css comes back untouched and never loads the engine', async () => {
    const vfs = new MemoryVfs({ files });
    const tailwind = fakeTailwind([]);
    const result = await new TailwindTransform({ tailwind }).transform({
      path: '/src/index.css',
      css: 'body { color: red; }',
      vfs,
      resolve: resolverFor(vfs),
    });

    expect(result).toBe('body { color: red; }');
    expect(tailwind.compile).not.toHaveBeenCalled();
  });

  // The engine comes from the host; the stylesheets have to be in the project.
  it('reads the Tailwind entry out of the VFS, through the style condition', async () => {
    const vfs = new MemoryVfs({ files });
    const loaded: string[] = [];

    await new TailwindTransform({ tailwind: fakeTailwind(loaded) }).transform({
      path: '/src/index.css',
      css: "@import 'tailwindcss';",
      vfs,
      resolve: resolverFor(vfs),
    });

    expect(loaded).toEqual(['/node_modules/tailwindcss/index.css']);
  });

  it('says what to install when the package is not in the VFS', async () => {
    const vfs = new MemoryVfs({ files: { '/src/index.css': "@import 'tailwindcss';" } });

    await expect(
      new TailwindTransform({ tailwind: fakeTailwind([]) }).transform({
        path: '/src/index.css',
        css: "@import 'tailwindcss';",
        vfs,
        resolve: resolverFor(vfs),
      }),
    ).rejects.toThrow(/install\(\{ dev: \['tailwindcss'\] \}\)/);
  });

  // @plugin and @config point at JavaScript, and running project code is the one line here.
  it('refuses to load a plugin module', async () => {
    const vfs = new MemoryVfs({ files });
    const tailwind: TailwindApi = {
      compile: async (_css, options) => {
        await options.loadModule('./plugin.js');

        return { build: () => '' };
      },
    };

    await expect(
      new TailwindTransform({ tailwind }).transform({
        path: '/src/index.css',
        css: "@import 'tailwindcss';",
        vfs,
        resolve: resolverFor(vfs),
      }),
    ).rejects.toThrow(/would run project code/);
  });
});
