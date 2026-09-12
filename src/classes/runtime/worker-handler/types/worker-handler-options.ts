/** Everything the worker needs to stand up a filesystem and a standard library of its own. */
export interface WorkerHandlerOptions {
  cwd?: string;
  env?: Record<string, string>;
  conditions?: string[];
}
