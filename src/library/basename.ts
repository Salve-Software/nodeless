import { normalizePath } from './normalize-path.js';

export function basename(path: string): string {
  const normalized = normalizePath(path);

  return normalized.slice(normalized.lastIndexOf('/') + 1);
}
