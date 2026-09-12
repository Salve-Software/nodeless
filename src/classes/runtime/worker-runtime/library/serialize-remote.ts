import type { SerializeScope } from '@/classes/runtime/worker-runtime/types/index.js';
import {
  FUNCTION_HANDLE_KEY,
  MAX_SERIALIZE_DEPTH,
} from '@/classes/runtime/worker-runtime/constants/index.js';

/**
 * Structured clone cannot carry a function, and a plugin is mostly functions. Each one is
 * replaced by a handle the other side turns back into a call over the channel.
 */
export function serializeRemote(value: unknown, scope: SerializeScope): unknown {
  if (typeof value === 'function') {
    return { [FUNCTION_HANDLE_KEY]: scope.register(value as never) };
  }
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Uint8Array || value instanceof Date || value instanceof RegExp) {
    return value;
  }
  if (scope.depth >= MAX_SERIALIZE_DEPTH || scope.seen.has(value)) return undefined;

  scope.seen.add(value);

  const next = { ...scope, depth: scope.depth + 1 };

  if (Array.isArray(value)) return value.map((entry) => serializeRemote(entry, next));

  const plain: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    plain[key] = serializeRemote(entry, next);
  }

  return plain;
}
