import { SEALED_PROCESS_MEMBERS } from '@/classes/runtime/worker-handler/constants/index.js';

/**
 * Returns the names it removed. Empty in a browser, where there is no `process` to seal —
 * which is why this is not a Node-only file.
 */
export function sealProcess(scope: Record<string, unknown>): string[] {
  const target = scope['process'] as Record<string, unknown> | undefined;

  if (typeof target !== 'object' || target === null) return [];

  const sealed: string[] = [];

  for (const name of SEALED_PROCESS_MEMBERS) {
    if (!(name in target)) continue;

    try {
      Reflect.deleteProperty(target, name);
      Object.defineProperty(target, name, { value: undefined, configurable: false });
      sealed.push(name);
    } catch {
      // A non-configurable member cannot be removed. Nothing to do but leave it named.
    }
  }

  return sealed;
}
