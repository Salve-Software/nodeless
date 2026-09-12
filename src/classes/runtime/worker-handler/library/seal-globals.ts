import { SEALED_GLOBALS } from '@/classes/runtime/worker-handler/constants/index.js';

/** Returns the names it actually removed, so a caller can assert the sandbox is real. */
export function sealGlobals(scope: Record<string, unknown>): string[] {
  const sealed: string[] = [];

  for (const name of SEALED_GLOBALS) {
    if (!(name in scope)) continue;

    try {
      Reflect.deleteProperty(scope, name);
      Object.defineProperty(scope, name, { value: undefined, configurable: false });
      sealed.push(name);
    } catch {
      // A non-configurable global cannot be removed. Nothing to do but leave it named.
    }
  }

  return sealed;
}
