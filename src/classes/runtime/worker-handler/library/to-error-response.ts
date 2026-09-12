import type { WorkerResponse } from '@/classes/runtime/worker-runtime/types/index.js';

/** An `Error` does not survive structured clone whole, so it crosses as its parts. */
export function toErrorResponse(id: number, error: unknown): WorkerResponse {
  if (!(error instanceof Error)) return { id, ok: false, message: String(error) };

  return {
    id,
    ok: false,
    message: error.message,
    ...(error.stack === undefined ? {} : { stack: error.stack }),
  };
}
