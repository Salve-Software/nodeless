import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NodelessProject } from '@/nodeless-project.class.js';
import { readTree } from '@example/read-project-files.js';

const REPO_ROOT = resolve(import.meta.dirname, '../../../..');

/** The real thing: a .scss file that also uses @apply, which no single transform can do. */
describe('transform pipeline, end to end', () => {
  const files = {
    '/package.json': '{}',
    '/src/main.ts': "import './style.scss';\nexport const x = 1;",
    '/src/style.scss':
      "@reference 'tailwindcss';\n$pad: 1rem;\n.btn { padding: $pad; @apply flex; }",
    '/src/App.tsx': 'export const c = "flex";',
    ...readTree(join(REPO_ROOT, 'node_modules/tailwindcss'), '/node_modules/tailwindcss'),
  };

  // Before the pipeline, Tailwind claimed the file first and choked on `$pad: 1rem;`.
  it('sass turns it into css, then tailwind reads the css', async () => {
    const result = await new NodelessProject({ files }).build({ mode: 'development' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const css = new TextDecoder().decode(result.files['bundle.css'] ?? new Uint8Array());

    expect(css).toContain('padding: 1rem');
    expect(css).toContain('display: flex');
  });
});
