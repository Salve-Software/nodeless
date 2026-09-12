import type { BuildResult, FileInput } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodelessProject } from '@/index.js';

const WITH_CONFIG: FileInput = {
  '/src/main.ts': 'export const x = 1;',
  '/vite.config.js': 'export default { define: { __A__: "1" } };',
};

async function warnings(
  files: FileInput,
  options: { isolation?: 'none' | 'worker' } = {},
): Promise<string[]> {
  const result: BuildResult = await new NodelessProject({ files, ...options }).build();

  return result.warnings.map((warning) => warning.text);
}

describe('the warning about where a config ran', () => {
  it('is there when a config ran and nobody chose', async () => {
    expect((await warnings(WITH_CONFIG)).join()).toMatch(/isolation.*was not set/);
  });

  it('names the config file, so the warning points somewhere', async () => {
    const result = await new NodelessProject({ files: WITH_CONFIG }).build();

    expect(result.warnings.map((warning) => warning.file)).toContain('/vite.config.js');
  });

  it('is gone once the caller says none, because that is a decision', async () => {
    expect(await warnings(WITH_CONFIG, { isolation: 'none' })).toEqual([]);
  });

  it('is absent for a project with no config, which evaluates nothing', async () => {
    expect(await warnings({ '/src/main.ts': 'export const x = 1;' })).toEqual([]);
  });

  it('does not change the build, only what it says about it', async () => {
    const silent = await new NodelessProject({
      files: WITH_CONFIG,
      isolation: 'none',
    }).build();
    const warned = await new NodelessProject({ files: WITH_CONFIG }).build();

    expect(silent.ok && warned.ok).toBe(true);
    if (!silent.ok || !warned.ok) return;
    expect([...(warned.files['bundle.js'] ?? [])]).toEqual([
      ...(silent.files['bundle.js'] ?? []),
    ]);
  });
});
