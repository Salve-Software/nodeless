import type { WorkerRequest } from '@/classes/runtime/index.js';
import type { Disposer, RuntimeChannel } from '@/types/index.js';
import { WorkerHandler } from '@/classes/runtime/index.js';

/**
 * The worker half, in this thread. It gives no isolation and is not meant to — it is how the
 * protocol gets tested without a browser, and it is the same handler the real worker runs.
 */
export function inProcessChannel(): RuntimeChannel {
  const handler = new WorkerHandler();
  let listener: ((message: unknown) => void) | undefined;
  let terminated = false;

  return {
    post: (message) => {
      if (terminated) return;
      void handler.handle(message as WorkerRequest).then((response) => {
        if (!terminated) listener?.(response);
      });
    },
    listen: (onMessage): Disposer => {
      listener = onMessage;

      return () => (listener = undefined);
    },
    terminate: () => (terminated = true),
  };
}
