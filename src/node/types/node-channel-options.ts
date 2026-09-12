/** `env` is what the worker's own `process.env` holds. Empty is the point of it. */
export interface NodeChannelOptions {
  workerUrl?: string;
  env?: Record<string, string>;
  resourceLimits?: { maxOldGenerationSizeMb?: number; stackSizeMb?: number };
}
