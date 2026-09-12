import type { WorkerRequest, WorkerScope } from '@/classes/runtime/index.js';
import { sealGlobals, WorkerHandler } from '@/classes/runtime/index.js';

/**
 * The worker entry, and the second thing this package exports. It is published bundled and
 * self-contained: a blob Worker inherits no import map, so a bare specifier inside it would
 * not resolve.
 */
export function startRuntimeWorker(scope: WorkerScope = globalThis): void {
  sealGlobals(globalThis);

  const handler = new WorkerHandler();

  scope.addEventListener('message', (event) => {
    void handler
      .handle(event.data as WorkerRequest)
      .then((response) => scope.postMessage(response));
  });
}
