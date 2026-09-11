import { ROOT_PATH } from '@/constants/index.js';
import { normalizePath } from './normalize-path.js';

export function dirname(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf('/');

  return index <= 0 ? ROOT_PATH : normalized.slice(0, index);
}
