import type { BuildResult } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodelessProject } from '@/index.js';
import { bytesToText } from '@/library/index.js';

/** What the config saw, as the literal that `define` put into the bundle. */
async function sawInConfig(expression: string): Promise<string> {
  const project = new NodelessProject({
    files: {
      '/src/main.ts': 'export const x = __SEEN__;',
      '/vite.config.js': `export default { define: { __SEEN__: JSON.stringify(${expression}) } };`,
    },
  });
  const result: BuildResult = await project.build();

  if (!result.ok) throw new Error(result.errors.map((error) => error.text).join(' | '));

  const bundle = bytesToText(result.files['bundle.js'] ?? new Uint8Array());

  return /"([^"]*)"/.exec(bundle)?.[1] ?? '';
}

describe('what a config can see of the host process', () => {
  it('gets the shim for a bare process reference, not the host one', async () => {
    process.env['API_DB_PASSWORD'] = 'hunter2';

    await expect(
      sawInConfig("process.env.API_DB_PASSWORD ?? 'not visible'"),
    ).resolves.toBe('not visible');
  });

  it('gets the VFS root from process.cwd(), not the directory the build runs in', async () => {
    await expect(sawInConfig('process.cwd()')).resolves.toBe('/');
  });

  it('gets the shimmed filesystem from a bare require, not the real one', async () => {
    await expect(
      sawInConfig("require('node:fs').existsSync('/etc/passwd') ? 'real fs' : 'the vfs'"),
    ).resolves.toBe('the vfs');
  });

  // A literal require fails at bundle time; a computed one is what reaches the shim.
  it('refuses a computed require, which is the one the bundler could not resolve', async () => {
    await expect(
      sawInConfig(
        "(() => { try { require(['node','fs','promises'].join('/')); return 'reached'; } catch { return 'refused'; } })()",
      ),
    ).resolves.toBe('refused');
  });

  // The gap `isolation: 'worker'` exists to close: in-process, `globalThis` is the host's.
  it('still reaches the host through globalThis, which is why isolation is an option', async () => {
    process.env['API_DB_PASSWORD'] = 'hunter2';

    await expect(
      sawInConfig("globalThis.process?.env?.API_DB_PASSWORD ?? 'not visible'"),
    ).resolves.toBe('hunter2');
  });
});
