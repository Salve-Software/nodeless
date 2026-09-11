import type { BuildMessage } from './build-message.js';
import type { FileMap } from './file-map.js';

/** Build output in memory. The `files` keys are relative to `outdir`. */
export interface BuildSuccess {
  ok: true;
  files: FileMap;
  warnings: BuildMessage[];
  durationMs: number;
}
