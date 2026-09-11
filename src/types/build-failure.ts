import type { BuildMessage } from './build-message.js';

export interface BuildFailure {
  ok: false;
  errors: BuildMessage[];
  warnings: BuildMessage[];
  durationMs: number;
}
