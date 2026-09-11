import type {
  TailwindApi,
  TailwindStylesheet,
} from '@/classes/transform/tailwind-transform/types/index.js';
import type { TransformInput, Vfs } from '@/types/index.js';
import { describe, expect, it, vi } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { TailwindTransform } from '@/classes/transform/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

const files = {
  '/src/index.css': "@import 'tailwindcss';",
  '/src/App.tsx': '<h1 className="flex">hi</h1>',
  '/node_modules/tailwindcss/package.json':
    '{"name":"tailwindcss","exports":{".":{"style":"./index.css"}}}',
  '/node_modules/tailwindcss/index.css': '@layer utilities;',
};

function input(content: string, vfs: Vfs = new MemoryVfs({ files })): TransformInput {
  const resolver = new NodeResolver({ vfs });

  return {
    path: '/src/index.css',
    content,
    vfs,
    resolve: (specifier) => {
      try {
        const found = resolver.resolve({ specifier, importer: '/src/index.css' });

        return found.kind === 'file' ? found.path : undefined;
      } catch {
        return undefined;
      }
    },
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
  // Loading the engine for a stylesheet that never needed it would be waste on every build.
  it('claims a stylesheet using its directives and nothing else', () => {
    const transform = new TailwindTransform();

    expect(transform.matches({ path: '/a.css', content: "@import 'tailwindcss';" })).toBe(
      true,
    );
    expect(transform.matches({ path: '/a.css', content: '.a { @apply flex; }' })).toBe(
      true,
    );
    expect(transform.matches({ path: '/a.css', content: 'body { color: red; }' })).toBe(
      false,
    );
  });

  it('compiles with the candidates found in the VFS', async () => {
    const result = await new TailwindTransform({ tailwind: fakeTailwind([]) }).apply(
      input("@import 'tailwindcss';"),
    );

    expect(result.content).toContain('flex');
    expect(result.loader).toBe('css');
  });

  // The engine comes from the host; the stylesheets have to be in the project.
  it('reads the Tailwind entry out of the VFS, through the style condition', async () => {
    const loaded: string[] = [];

    await new TailwindTransform({ tailwind: fakeTailwind(loaded) }).apply(
      input("@import 'tailwindcss';"),
    );

    expect(loaded).toEqual(['/node_modules/tailwindcss/index.css']);
  });

  it('says what to install when the package is not in the VFS', async () => {
    const bare = new MemoryVfs({ files: { '/src/index.css': "@import 'tailwindcss';" } });

    await expect(
      new TailwindTransform({ tailwind: fakeTailwind([]) }).apply(
        input("@import 'tailwindcss';", bare),
      ),
    ).rejects.toThrow(/install\(\{ dev: \['tailwindcss'\] \}\)/);
  });

  // @plugin and @config point at JavaScript, and running project code is the one line here.
  it('refuses to load a plugin module', async () => {
    const tailwind: TailwindApi = {
      compile: async (_css, options) => {
        await options.loadModule('./plugin.js');

        return { build: () => '' };
      },
    };

    await expect(
      new TailwindTransform({ tailwind }).apply(input("@import 'tailwindcss';")),
    ).rejects.toThrow(/would run project code/);
  });
});
