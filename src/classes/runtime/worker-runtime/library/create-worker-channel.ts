import type { RuntimeChannel } from '@/types/index.js';

/**
 * A module Worker built from a blob, so the host has no second file to serve. The worker
 * entry is bundled self-contained: a blob worker inherits no import map, and a bare
 * specifier in it would not resolve.
 */
export function createWorkerChannel(workerUrl: string): RuntimeChannel {
  if (typeof Worker === 'undefined') {
    throw new Error(
      'WorkerRuntime needs a browser `Worker`. On a server, pass `channel` with an implementation over worker_threads, or use the default ModuleRuntime.',
    );
  }

  const source = `import { startRuntimeWorker } from ${JSON.stringify(workerUrl)};\nstartRuntimeWorker();\n`;
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  const worker = new Worker(url, { type: 'module' });

  return {
    post: (message) => worker.postMessage(message),
    listen: (onMessage) => {
      const handler = (event: MessageEvent): void => onMessage(event.data);

      worker.addEventListener('message', handler);

      return () => worker.removeEventListener('message', handler);
    },
    terminate: () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    },
  };
}
