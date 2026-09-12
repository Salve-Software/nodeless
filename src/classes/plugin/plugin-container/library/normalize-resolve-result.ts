import type { PluginResolveResult } from '@/types/index.js';

export function normalizeResolveResult(
  result: PluginResolveResult,
): { id: string; external: boolean } | undefined {
  if (result === null || result === undefined) return undefined;
  if (typeof result === 'string') return { id: result, external: false };

  return { id: result.id, external: result.external ?? false };
}
