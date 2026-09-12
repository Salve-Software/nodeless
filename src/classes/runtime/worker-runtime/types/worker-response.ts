/** Worker to main thread. An error crosses as data, because an Error does not clone whole. */
export type WorkerResponse =
  | { id: number; ok: true; value: unknown }
  | { id: number; ok: false; message: string; stack?: string };
