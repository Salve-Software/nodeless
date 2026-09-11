/** Node's `path.normalize`: a relative path stays relative and a trailing slash survives. */
export function posixNormalize(path: string): string {
  if (path === '') return '.';

  const absolute = path.startsWith('/');
  const trailing = path.length > 1 && path.endsWith('/');
  const segments: string[] = [];

  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment !== '..') {
      segments.push(segment);
      continue;
    }

    const last = segments[segments.length - 1];

    if (last !== undefined && last !== '..') segments.pop();
    else if (!absolute) segments.push('..');
  }

  const joined = segments.join('/');

  if (joined === '') return absolute ? '/' : '.';

  return `${absolute ? '/' : ''}${joined}${trailing ? '/' : ''}`;
}
