import type { EsbuildApi, Resolver, RuntimeChannel, Vfs } from '@/types/index.js';

/** `channel` defaults to a module Worker; a host that bundles its own can pass one. */
export interface WorkerRuntimeOptions {
  vfs: Vfs;
  resolver: Resolver;
  esbuild?: EsbuildApi;
  wasmURL?: string;
  cwd?: string;
  env?: Record<string, string>;
  conditions?: string[];
  channel?: () => RuntimeChannel;
  workerUrl?: string;
}
