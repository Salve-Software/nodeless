import type { FileMap } from '@/types/index.js';

/** npm roots every tarball at `package/`. Old ones use the package name instead. */
export function stripRootDir(files: FileMap): FileMap {
  const paths = Object.keys(files);
  const roots = new Set(paths.map((path) => path.split('/')[0] ?? ''));

  if (roots.size !== 1) return files;

  const [root] = [...roots];
  const stripped: FileMap = {};

  for (const [path, bytes] of Object.entries(files)) {
    const rest = path.slice((root ?? '').length + 1);

    if (rest !== '') stripped[rest] = bytes;
  }

  return stripped;
}
