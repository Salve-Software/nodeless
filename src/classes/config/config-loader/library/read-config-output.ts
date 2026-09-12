import { normalizePath } from '@/library/index.js';

export function readConfigOutput(config: Record<string, unknown>): {
  outdir?: string;
  base?: string;
} {
  const outDir = (config['build'] as { outDir?: unknown } | undefined)?.outDir;
  const base = config['base'];

  return {
    ...(typeof outDir === 'string' ? { outdir: normalizePath(outDir) } : {}),
    ...(typeof base === 'string' ? { base } : {}),
  };
}
