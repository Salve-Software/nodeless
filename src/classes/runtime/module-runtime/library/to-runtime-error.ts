import { RuntimeError } from '@/errors/index.js';

/**
 * A failure inside the config graph has to say which module, or the stack points at a
 * bundle nobody wrote. `cause` keeps the original for whoever wants the real frames.
 */
export function toRuntimeError(error: unknown, path: string): RuntimeError {
  const message = error instanceof Error ? error.message : String(error);

  return new RuntimeError(`Failed to run ${path}: ${message}`, {
    path,
    cause: error,
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
  });
}
