import type { RuntimeModule } from './runtime-module.js';

/**
 * Evaluates a module out of the VFS. This is the port that separates the two graphs: the
 * toolchain runs through here, the project's own code never does.
 */
export interface Runtime {
  import(path: string): Promise<RuntimeModule>;
  invalidate?(): void;
  dispose(): Promise<void>;
}
