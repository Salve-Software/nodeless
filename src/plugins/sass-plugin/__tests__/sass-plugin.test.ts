import type { PluginContext, Vfs } from '@/types/index.js';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { sassPlugin } from '@/plugins/index.js';

function contextFor(files: Record<string, string>): PluginContext {
  const vfs: Vfs = new MemoryVfs({ files });
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

async function compile(
  files: Record<string, string>,
  id = '/src/main.scss',
): Promise<{ code: string; loader?: string } | null | undefined> {
  const plugin = sassPlugin({ sass });
  const context = contextFor(files);
  const result = await plugin.transform?.call(context, context.vfs.readText(id), id);

  return result as { code: string; loader?: string } | null | undefined;
}

describe('claiming a file', () => {
  it('ignores plain CSS', async () => {
    expect(await compile({ '/src/a.css': '.a{color:red}' }, '/src/a.css')).toBeNull();
  });

  it('claims .scss and .sass', async () => {
    expect(await compile({ '/src/main.scss': '.a{color:red}' })).not.toBeNull();
    expect(
      await compile({ '/src/main.sass': '.a\n  color: red' }, '/src/main.sass'),
    ).not.toBeNull();
  });
});

describe('compiling', () => {
  it('flattens nesting and reports the css loader', async () => {
    const result = await compile({ '/src/main.scss': '.a { .b { color: red } }' });

    expect(result?.code.replace(/\s+/g, ' ')).toContain('.a .b');
    expect(result?.loader).toBe('css');
  });

  it('resolves a relative @use through the VFS', async () => {
    const result = await compile({
      '/src/main.scss': "@use './vars'; .a { color: vars.$brand }",
      '/src/_vars.scss': '$brand: #123456;',
    });

    expect(result?.code).toContain('#123456');
  });

  it('resolves a bare @use to a package', async () => {
    const result = await compile({
      '/src/main.scss': "@use 'theme'; .a { color: theme.$brand }",
      '/node_modules/theme/package.json':
        '{"name":"theme","exports":{".":{"sass":"./index.scss","style":"./index.scss"}}}',
      '/node_modules/theme/index.scss': '$brand: #abcdef;',
    });

    expect(result?.code).toContain('#abcdef');
  });
});
