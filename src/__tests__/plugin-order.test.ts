import type { Plugin } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodelessProject } from '@/index.js';
import { bytesToText } from '@/library/index.js';

async function css(
  files: Record<string, string>,
  plugins: Plugin[] = [],
): Promise<string> {
  const result = await new NodelessProject({ files, plugins }).build();

  if (!result.ok) throw new Error(result.errors.map((error) => error.text).join(' | '));

  return bytesToText(result.files['bundle.css'] ?? new Uint8Array());
}

describe('the built-in plugins run in the right order', () => {
  // Tailwind claims a stylesheet the moment it sees `@apply`, and would otherwise eat
  // the `@use` that Sass still needs.
  it('compiles sass before tailwind reads the stylesheet', async () => {
    const output = await css({
      '/src/main.ts': "import './main.scss';\nexport const x = 1;",
      '/src/_vars.scss': '$brand: #123456;',
      '/src/main.scss':
        "@use './vars';\n.card {\n  color: vars.$brand;\n  .inner { @apply flex; }\n}",
    });

    expect(output).toContain('#123456');
    expect(output).toContain('.card .inner');
    expect(output).toContain('display:flex');
  });

  it('lets a caller plugin claim a stylesheet before either of them', async () => {
    const output = await css(
      {
        '/src/main.ts': "import './main.scss';\nexport const x = 1;",
        '/src/main.scss': '.a { color: $undefined-on-purpose; }',
      },
      [
        {
          name: 'mine',
          transform: (_code, id) =>
            id.endsWith('.scss') ? { code: '.a { color: teal; }', loader: 'css' } : null,
        },
      ],
    );

    expect(output).toContain('teal');
  });
});
