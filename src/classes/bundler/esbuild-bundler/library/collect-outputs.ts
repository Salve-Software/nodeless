import type { FileMap } from '@/types/index.js';
import type { OutputFile } from 'esbuild-wasm';
import { basename, normalizePath } from '@/library/index.js';

/** Keys relative to `outdir`: consumers want `bundle.js`, not `/dist/bundle.js`. */
export function collectOutputs(
  outputFiles: readonly OutputFile[],
  outdir: string,
): FileMap {
  const prefix = `${normalizePath(outdir)}/`;
  const files: FileMap = {};

  for (const file of outputFiles) {
    const path = normalizePath(file.path);

    files[path.startsWith(prefix) ? path.slice(prefix.length) : basename(path)] =
      file.contents;
  }

  return files;
}
