import type { TailwindApi, TailwindStylesheet } from '@/plugins/tailwind-plugin/index.js';
import type { PluginContext, Vfs } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { tailwindPlugin } from '@/plugins/index.js';

const files = {
  '/src/index.css': "@import 'tailwindcss';",
  '/src/App.tsx': '<h1 className="flex">hi</h1>',
  '/node_modules/tailwindcss/package.json':
    '{"name":"tailwindcss","exports":{".":{"style":"./index.css"}}}',
  '/node_modules/tailwindcss/index.css': '@layer utilities;',
};

function contextFor(vfs: Vfs = new MemoryVfs({ files })): PluginContext {
  const resolver = new NodeResolver({ vfs });

  return {
    vfs,
    resolve: (specifier, importer) => {
      try {
        const found = resolver.resolve({ specifier, importer });

        return found.kind === 'file' ? found.path : undefined;
      } catch {
        return undefined;
      }
    },
  };
}

function fakeTailwind(loaded: string[]): TailwindApi {
  return {
    compile: async (css, options) => {
      const sheets: TailwindStylesheet[] = [];

      for (const match of css.matchAll(/@import\s+'([^']+)'/g)) {
        sheets.push(await options.loadStylesheet(match[1] ?? '', options.base));
      }
      loaded.push(...sheets.map((sheet) => sheet.path));

      return { build: (candidates) => `/* ${candidates.sort().join(' ')} */` };
    },
  };
}

async function run(
  code: string,
  { context = contextFor(), api }: { context?: PluginContext; api: TailwindApi },
): Promise<unknown> {
  const plugin = tailwindPlugin({ tailwind: api });

  return plugin.transform?.call(context, code, '/src/index.css');
}

describe('claiming a stylesheet', () => {
  it('ignores plain CSS, which has none of the directives', async () => {
    expect(await run('.a { color: red }', { api: fakeTailwind([]) })).toBeNull();
  });

  it('claims a stylesheet that imports tailwindcss', async () => {
    expect(await run("@import 'tailwindcss';", { api: fakeTailwind([]) })).not.toBeNull();
  });

  it('claims a stylesheet that only uses @apply', async () => {
    expect(await run('.a { @apply flex }', { api: fakeTailwind([]) })).not.toBeNull();
  });

  it('leaves nothing to claim once the CSS is already compiled', async () => {
    expect(await run('.flex { display: flex }', { api: fakeTailwind([]) })).toBeNull();
  });
});

describe('reading through the VFS', () => {
  it('resolves a bare import to the package style entry', async () => {
    const loaded: string[] = [];

    await run("@import 'tailwindcss';", { api: fakeTailwind(loaded) });

    expect(loaded).toEqual(['/node_modules/tailwindcss/index.css']);
  });

  it('says how to install a stylesheet it cannot find', async () => {
    const context = contextFor(new MemoryVfs({ files: { '/src/index.css': '' } }));

    await expect(
      run("@import 'tailwindcss';", { context, api: fakeTailwind([]) }),
    ).rejects.toThrowError(/install\(\{ dev: \['tailwindcss'\] \}\)/);
  });
});

describe('candidates', () => {
  it('feeds it the tokens found in the project sources', async () => {
    const result = (await run("@import 'tailwindcss';", {
      api: fakeTailwind([]),
    })) as { code: string };

    expect(result.code).toContain('flex');
  });

  it('emits CSS whatever the input extension was', async () => {
    const result = (await run('.a { @apply flex }', { api: fakeTailwind([]) })) as {
      loader: string;
    };

    expect(result.loader).toBe('css');
  });
});

describe('@plugin and @config', () => {
  it('points at the runtime instead of silently ignoring them', async () => {
    const api: TailwindApi = {
      compile: async (_css, options) => {
        await options.loadModule('./tw-plugin.js');

        return { build: () => '' };
      },
    };

    await expect(run("@plugin './tw-plugin.js';", { api })).rejects.toThrowError(
      /@tailwindcss\/vite/,
    );
  });
});
