import { normalizePath } from './normalize-path.js';

export function joinPath(base: string, relative: string): string {
  return normalizePath(`${base}/${relative}`);
}
