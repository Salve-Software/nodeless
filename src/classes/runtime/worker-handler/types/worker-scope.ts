/** The slice of `DedicatedWorkerGlobalScope` the entry uses, so `lib.dom` is not needed. */
export interface WorkerScope {
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  postMessage(message: unknown): void;
}
