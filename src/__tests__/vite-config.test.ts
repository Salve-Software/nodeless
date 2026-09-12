import type { BuildResult, FileInput } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodelessProject } from '@/index.js';
import { bytesToText } from '@/library/index.js';

function text(result: BuildResult, name = 'bundle.js'): string {
  if (!result.ok) throw new Error(result.errors.map((error) => error.text).join('\n'));

  return bytesToText(result.files[name] ?? new Uint8Array());
}

async function build(files: FileInput, mode?: 'development' | 'production') {
  const project = new NodelessProject({ files });

  return project.build(mode ? { mode } : {});
}

describe('a project with no config', () => {
  it('builds exactly as it did before there was a runtime', async () => {
    const result = await build({ '/src/main.ts': 'export const greeting = "plain";' });

    expect(text(result)).toContain('plain');
  });
});

describe('a plugin declared in the config', () => {
  const project: FileInput = {
    '/src/main.ts': 'export const greeting = "REPLACE_ME";',
    '/vite.config.ts': `
      export default {
        plugins: [
          {
            name: 'shout',
            transform(code, id) {
              return id.endsWith('main.ts') ? code.replace('REPLACE_ME', 'from a plugin') : null;
            },
          },
        ],
      };
    `,
  };

  it('runs against the project graph', async () => {
    expect(text(await build(project))).toContain('from a plugin');
  });

  it('is written in TypeScript and compiled on the way in', async () => {
    const result = await build({
      '/src/main.ts': 'export const x = "before";',
      '/vite.config.ts': `
        import type { Plugin } from 'nowhere';
        const plugin = {
          name: 'typed',
          transform: (code: string, id: string): string | null =>
            id.endsWith('main.ts') ? code.replace('before', 'after') : null,
        };
        export default { plugins: [plugin] };
      `,
    });

    expect(text(result)).toContain('after');
  });

  it('can be imported from node_modules, which is the whole point', async () => {
    const result = await build({
      '/src/main.ts': 'export const x = "before";',
      '/vite.config.js': `
        import shout from 'vite-plugin-shout';
        export default { plugins: [shout()] };
      `,
      '/node_modules/vite-plugin-shout/package.json':
        '{"name":"vite-plugin-shout","version":"1.0.0","main":"index.js"}',
      '/node_modules/vite-plugin-shout/index.js': `
        module.exports = () => ({
          name: 'shout',
          transform: (code, id) => (id.endsWith('main.ts') ? code.replace('before', 'after') : null),
        });
      `,
    });

    expect(text(result)).toContain('after');
  });

  it('can read the VFS through the plugin context', async () => {
    const result = await build({
      '/src/main.ts': 'export const x = "before";',
      '/src/replacement.txt': 'from disk',
      '/vite.config.js': `
        export default {
          plugins: [
            {
              name: 'inline',
              transform(code, id) {
                return id.endsWith('main.ts')
                  ? code.replace('before', this.vfs.readText('/src/replacement.txt'))
                  : null;
              },
            },
          ],
        };
      `,
    });

    expect(text(result)).toContain('from disk');
  });

  it('can stand up a virtual module that is not in the VFS', async () => {
    const result = await build({
      '/src/main.ts': "export { version } from 'virtual:build-info';",
      '/vite.config.js': `
        export default {
          plugins: [
            {
              name: 'virtual',
              resolveId: (source) => (source === 'virtual:build-info' ? '/virtual/build-info.js' : null),
              load: (id) => (id === '/virtual/build-info.js' ? 'export const version = "1.2.3";' : null),
            },
          ],
        };
      `,
    });

    expect(text(result)).toContain('1.2.3');
  });
});

describe('the rest of the config', () => {
  it('applies define', async () => {
    const result = await build({
      '/src/main.ts': 'export const flag = __FEATURE__;',
      '/vite.config.js': `export default { define: { __FEATURE__: JSON.stringify('on') } };`,
    });

    expect(text(result)).toContain('on');
  });

  it('applies resolve.alias, in both spellings', async () => {
    const object = await build({
      '/src/main.ts': "export { value } from '~lib/value.js';",
      '/src/lib/value.js': 'export const value = "aliased";',
      '/vite.config.js': `export default { resolve: { alias: { '~lib': '/src/lib' } } };`,
    });
    const array = await build({
      '/src/main.ts': "export { value } from '~lib/value.js';",
      '/src/lib/value.js': 'export const value = "aliased";',
      '/vite.config.js': `export default { resolve: { alias: [{ find: '~lib', replacement: '/src/lib' }] } };`,
    });

    expect(text(object)).toContain('aliased');
    expect(text(array)).toContain('aliased');
  });

  it('accepts defineConfig as a function of the build env', async () => {
    const result = await build(
      {
        '/src/main.ts': 'export const mode = __MODE__;',
        '/vite.config.js': `
          export default ({ mode }) => ({ define: { __MODE__: JSON.stringify(mode) } });
        `,
      },
      'development',
    );

    expect(text(result)).toContain('development');
  });

  it('accepts an async config function', async () => {
    const result = await build({
      '/src/main.ts': 'export const x = __ASYNC__;',
      '/vite.config.js': `
        export default async () => ({ define: { __ASYNC__: JSON.stringify('resolved') } });
      `,
    });

    expect(text(result)).toContain('resolved');
  });
});

describe('a config that reaches for node', () => {
  it('reads the VFS through node:fs, not a disk', async () => {
    const result = await build({
      '/src/main.ts': 'export const x = __BANNER__;',
      '/banner.txt': 'hello from the vfs',
      '/vite.config.js': `
        import { readFileSync } from 'node:fs';
        import { join } from 'node:path';
        export default {
          define: { __BANNER__: JSON.stringify(readFileSync(join('/', 'banner.txt'), 'utf8')) },
        };
      `,
    });

    expect(text(result)).toContain('hello from the vfs');
  });
});

describe('a config that fails', () => {
  it('says which file threw', async () => {
    const project = new NodelessProject({
      files: {
        '/src/main.ts': 'export const x = 1;',
        '/vite.config.js': `throw new Error('bad config');`,
      },
    });

    await expect(project.build()).rejects.toThrowError(
      /Failed to run \/vite\.config\.js: bad config/,
    );
  });
});

describe('editing the config', () => {
  it('is picked up on the next build, the way Vite restarts on one', async () => {
    const project = new NodelessProject({
      files: {
        '/src/main.ts': 'export const x = __TAG__;',
        '/vite.config.js': `export default { define: { __TAG__: JSON.stringify('first') } };`,
      },
    });

    expect(text(await project.build())).toContain('first');

    project.vfs.writeFile(
      '/vite.config.js',
      `export default { define: { __TAG__: JSON.stringify('second') } };`,
    );

    expect(text(await project.build())).toContain('second');
  });
});
