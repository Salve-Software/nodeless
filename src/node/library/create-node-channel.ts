import type { NodeChannelOptions } from '@/node/types/index.js';
import type { Disposer, RuntimeChannel } from '@/types/index.js';
import { Worker } from 'node:worker_threads';
import { defaultWorkerUrl } from '@/classes/runtime/worker-runtime/library/index.js';
import { NODE_RESOURCE_LIMITS } from '@/node/constants/index.js';
import { nodeBootstrapSource } from './node-bootstrap-source.js';

/**
 * The server half of `isolation: 'worker'`. A worker thread is a realm of its own, so the
 * config cannot reach the API's `globalThis` — and `env: {}` means its `process.env` is
 * empty rather than a copy of yours.
 */
export function createNodeChannel(options: NodeChannelOptions = {}): RuntimeChannel {
  const worker = new Worker(
    nodeBootstrapSource(options.workerUrl ?? defaultWorkerUrl()),
    {
      eval: true,
      env: options.env ?? {},
      resourceLimits: { ...NODE_RESOURCE_LIMITS, ...options.resourceLimits },
      stdout: true,
      stderr: true,
    },
  );

  worker.unref();

  return {
    post: (message) => worker.postMessage(message),
    listen: (onMessage): Disposer => {
      const onError = (error: Error): void =>
        onMessage({ id: -1, ok: false, message: error.message });

      worker.on('message', onMessage);
      worker.on('error', onError);

      return () => {
        worker.off('message', onMessage);
        worker.off('error', onError);
      };
    },
    terminate: () => void worker.terminate(),
  };
}
