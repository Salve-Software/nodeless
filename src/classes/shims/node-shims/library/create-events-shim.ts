import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';
import { NodelessEventEmitter } from '@/classes/shims/nodeless-event-emitter/index.js';

export function createEventsShim(): ShimModule {
  return {
    EventEmitter: NodelessEventEmitter,
    default: NodelessEventEmitter,
    once: async (emitter: NodelessEventEmitter, event: string) =>
      new Promise((resolve) => emitter.once(event, (...args) => resolve(args))),
  };
}
