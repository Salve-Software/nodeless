import { FUNCTION_HANDLE_KEY } from '@/classes/runtime/worker-runtime/constants/index.js';
import { isFunctionHandle } from './is-function-handle.js';

/**
 * Turns every handle back into an async stub. Async is not a compromise here: Rollup's own
 * `this.resolve` is async, and a hook crossing a thread could not be anything else.
 */
export function deserializeRemote(
  value: unknown,
  call: (handle: number, args: unknown[]) => Promise<unknown>,
): unknown {
  if (isFunctionHandle(value)) {
    const handle = value[FUNCTION_HANDLE_KEY];

    return async (...args: unknown[]) => call(handle, args);
  }
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Uint8Array) return value;
  if (Array.isArray(value)) {
    return value.map((entry) => deserializeRemote(entry, call));
  }

  const plain: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    plain[key] = deserializeRemote(entry, call);
  }

  return plain;
}
