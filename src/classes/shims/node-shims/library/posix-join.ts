import { posixNormalize } from './posix-normalize.js';

export function posixJoin(paths: string[]): string {
  const joined = paths.filter((path) => path !== '').join('/');

  return joined === '' ? '.' : posixNormalize(joined);
}
