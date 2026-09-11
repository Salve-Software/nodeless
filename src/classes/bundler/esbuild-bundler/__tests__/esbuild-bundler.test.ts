import type { BuildResult, FileInput } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { EsbuildBundler } from '@/classes/bundler/index.js';
import { NodeResolver } from '@/classes/resolver/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { bytesToText } from '@/library/index.js';

// Minimal stub: with `jsx: 'automatic'`, every TSX file imports `react/jsx-runtime`.
const REACT_STUB: FileInput = {
  '/node_modules/react/package.json': JSON.stringify({
    name: 'react',
    exports: { './jsx-runtime': './jsx-runtime.js' },
  }),
  '/node_modules/react/jsx-runtime.js':
    'export const jsx = () => null;\nexport const Fragment = 0;',
};

async function build(files: FileInput, options = {}): Promise<BuildResult> {
  const vfs = new MemoryVfs({ files });

  return new EsbuildBundler({ vfs, resolver: new NodeResolver({ vfs }) }).build(options);
}

function text(result: BuildResult, name: string): string {
  if (!result.ok) throw new Error(result.errors.map((error) => error.text).join('\n'));

  return bytesToText(result.files[name] ?? new Uint8Array());
}

describe('EsbuildBundler', () => {
  it('bundles TSX out of the VFS and returns the bundle plus HTML', async () => {
    const result = await build({
      ...REACT_STUB,
      '/src/main.tsx':
        "import { label } from './label.js';\nexport const view = <p>{label}</p>;",
      '/src/label.ts': "export const label = 'hello';",
    });

    expect(result.ok).toBe(true);
    expect(Object.keys(result.ok ? result.files : {}).sort()).toEqual([
      'bundle.js',
      'index.html',
    ]);
    expect(text(result, 'bundle.js')).toContain('hello');
    expect(text(result, 'index.html')).toContain('./bundle.js');
  });

  it('CSS imported from JS becomes bundle.css and lands in the HTML', async () => {
    const result = await build({
      '/src/main.ts': "import './app.css';\nexport const x = 1;",
      '/src/app.css': 'body { color: red; }',
    });

    expect(text(result, 'bundle.css')).toContain('red');
    expect(text(result, 'index.html')).toContain('./bundle.css');
  });

  it("uses the project's index.html instead of the template", async () => {
    const result = await build({
      '/src/main.ts': 'export const x = 1;',
      '/index.html': '<html><body><div id="app"></div></body></html>',
    });

    expect(text(result, 'index.html')).toContain('<div id="app"></div>');
  });

  // Acceptance criterion: a build error comes back structured, with nothing thrown.
  it('a syntax error returns file and line, and does not throw', async () => {
    const result = await build({ '/src/main.ts': 'export const x = ;' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.text).toBeTruthy();
    expect(result.errors[0]?.file).toContain('/src/main.ts');
    expect(result.errors[0]?.line).toBe(1);
  });

  it('an unresolved import returns an error naming the specifier', async () => {
    const result = await build({ '/src/main.ts': "import 'not-installed';" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.text).join('\n')).toContain(
      'not-installed',
    );
  });

  it('a project with no entry point returns an error saying what was expected', async () => {
    const result = await build({ '/other.ts': 'export const x = 1;' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.text).toContain('src/main.tsx');
  });

  it('a missing explicit entry is named in the error', async () => {
    const result = await build(
      { '/src/main.ts': 'export const x = 1;' },
      { entry: '/x.ts' },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.text).toContain('/x.ts');
  });

  // A Node builtin must not kill the build: it becomes an empty module and a readable warning.
  it('importing a Node builtin becomes a warning and an empty module', async () => {
    const result = await build({
      '/src/main.ts': "import fs from 'node:fs';\nexport const x = fs;",
    });

    expect(result.ok).toBe(true);
    expect(result.warnings.map((warning) => warning.text).join('\n')).toContain(
      'Node builtin',
    );
  });

  it('external lets the import through without touching the VFS', async () => {
    const result = await build(
      { '/src/main.ts': "export { createRoot } from 'react-dom/client';" },
      { external: ['react-dom'] },
    );

    expect(text(result, 'bundle.js')).toContain('react-dom/client');
  });

  it('development mode skips minification and embeds a sourcemap', async () => {
    const files = { '/src/main.ts': 'export const aVeryLongNameAMinifierWouldCut = 1;' };
    const development = await build(files, { mode: 'development' as const });
    const production = await build(files, { mode: 'production' as const });

    expect(text(development, 'bundle.js')).toContain('sourceMappingURL=data:');
    expect(text(production, 'bundle.js')).not.toContain('sourceMappingURL');
  });

  it('NODE_ENV comes in as a constant matching the mode', async () => {
    const result = await build({
      '/src/main.ts': 'export const env = process.env.NODE_ENV;',
    });

    expect(text(result, 'bundle.js')).toContain('production');
  });

  // Acceptance criterion: bundling is text transformation. Nothing in the project runs.
  it('never executes the project code during a build', async () => {
    const marker = '__nodelessShouldNeverRun';
    const result = await build({
      '/src/main.ts': `globalThis.${marker} = true;\nexport const x = 1;`,
    });

    expect(text(result, 'bundle.js')).toContain(marker);
    expect(marker in globalThis).toBe(false);
  });

  it('reports how long the build took', async () => {
    const result = await build({ '/src/main.ts': 'export const x = 1;' });

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('EsbuildBundler, css modules', () => {
  // Read in development mode, where esbuild keeps the generated names legible.
  const development = { mode: 'development' as const };

  it('scopes the class name and hands the mapping to the importer', async () => {
    const result = await build(
      {
        '/src/main.ts':
          "import styles from './card.module.css';\nexport const cls = styles.title;",
        '/src/card.module.css': '.title { color: red; }',
      },
      development,
    );

    expect(text(result, 'bundle.css')).toContain('.card_title');
    expect(text(result, 'bundle.css')).not.toContain('.title {');
    expect(text(result, 'bundle.js')).toContain('card_title');
  });

  it('plain css next to a module keeps its global name', async () => {
    const result = await build(
      {
        '/src/main.ts': "import './global.css';\nexport const x = 1;",
        '/src/global.css': '.title { color: blue; }',
      },
      development,
    );

    expect(text(result, 'bundle.css')).toContain('.title {');
  });

  // esbuild says nothing about a class the stylesheet never defined: it reads as
  // undefined at runtime. Worth pinning, because it is a trap and not a bug of ours.
  it('a class the module does not define builds clean and reads as undefined', async () => {
    const result = await build(
      {
        '/src/main.ts':
          "import styles from './card.module.css';\nexport const cls = styles.missing;",
        '/src/card.module.css': '.title { color: red; }',
      },
      development,
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings).toEqual([]);
  });
});

describe('EsbuildBundler, css transform', () => {
  function bundlerWith(
    cssTransform: (input: { css: string }) => string | Promise<string>,
  ) {
    const vfs = new MemoryVfs({
      files: {
        '/src/main.ts': "import './app.css';\nexport const x = 1;",
        '/src/app.css': '@custom { }',
      },
    });

    return new EsbuildBundler({ vfs, resolver: new NodeResolver({ vfs }), cssTransform });
  }

  it('lets a transform rewrite the stylesheet before esbuild parses it', async () => {
    const result = await bundlerWith(() => 'body { color: red; }').build();

    expect(text(result, 'bundle.css')).toContain('red');
  });

  // Tailwind has to see every stylesheet, not just the entry one.
  it('runs once per stylesheet in the graph', async () => {
    const seen: string[] = [];
    const vfs = new MemoryVfs({
      files: {
        '/src/main.ts': "import './a.css';\nimport './b.css';\nexport const x = 1;",
        '/src/a.css': '.a { color: red; }',
        '/src/b.css': '.b { color: blue; }',
      },
    });
    const bundler = new EsbuildBundler({
      vfs,
      resolver: new NodeResolver({ vfs }),
      cssTransform: ({ path, css }) => {
        seen.push(path);

        return css;
      },
    });

    await bundler.build();

    expect(seen.sort()).toEqual(['/src/a.css', '/src/b.css']);
  });

  it('a transform that throws comes back as a build error, not a crash', async () => {
    const result = await bundlerWith(() => {
      throw new Error('postcss blew up');
    }).build();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.text).join()).toContain('postcss blew up');
  });
});

describe('EsbuildBundler, cdn mode', () => {
  const cdn = { url: 'https://esm.sh' };
  const project = {
    '/package.json': '{"dependencies":{"zustand":"^5.0.0"}}',
    '/src/main.ts': "export { create } from 'zustand';",
  };

  it('an uninstalled package becomes a url instead of a build error', async () => {
    expect((await build(project)).ok).toBe(false);

    const result = await build(project, { cdn });

    expect(result.ok).toBe(true);
    expect(text(result, 'bundle.js')).toContain('https://esm.sh/zustand@^5.0.0');
  });

  // Whatever is installed still wins, so cdn mode composes with a real install.
  it('a package that is in the VFS is still bundled, not fetched', async () => {
    const result = await build(
      {
        ...project,
        '/node_modules/zustand/package.json': '{"name":"zustand","main":"index.js"}',
        '/node_modules/zustand/index.js': 'export const create = () => "local";',
      },
      { cdn },
    );

    expect(text(result, 'bundle.js')).toContain('local');
    expect(text(result, 'bundle.js')).not.toContain('esm.sh');
  });

  it('a relative import that does not exist is still an error', async () => {
    const result = await build({ '/src/main.ts': "import './gone.js';" }, { cdn });

    expect(result.ok).toBe(false);
  });

  // A builtin has no browser equivalent on a CDN either.
  it('a node builtin still becomes an empty module, not a url', async () => {
    const result = await build(
      { '/src/main.ts': "import 'node:fs';\nexport const x = 1;" },
      { cdn },
    );

    expect(result.ok).toBe(true);
    expect(text(result, 'bundle.js')).not.toContain('esm.sh');
  });
});
