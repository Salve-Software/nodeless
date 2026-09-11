import type { BuildOptions } from './build-options.js';
import type { BuildResult } from './build-result.js';

export interface Bundler {
  build(options?: BuildOptions): Promise<BuildResult>;
  dispose(): Promise<void>;
}
