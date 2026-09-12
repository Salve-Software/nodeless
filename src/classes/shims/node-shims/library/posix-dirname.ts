/** Node's `path.dirname`: a bare name is `.`, and only a rooted path gives `/`. */
export function posixDirname(path: string): string {
  const trimmed = path.length > 1 && path.endsWith('/') ? path.replace(/\/+$/, '') : path;
  const index = trimmed.lastIndexOf('/');

  if (index < 0) return '.';
  if (index === 0) return '/';

  return trimmed.slice(0, index);
}
