import { posixResolve } from './posix-resolve.js';

export function posixRelative({
  from,
  to,
  cwd,
}: {
  from: string;
  to: string;
  cwd: string;
}): string {
  const source = posixResolve([from], cwd).split('/');
  const target = posixResolve([to], cwd).split('/');
  let shared = 0;

  while (shared < source.length && source[shared] === target[shared]) shared += 1;

  return [
    ...Array.from({ length: source.length - shared }, () => '..'),
    ...target.slice(shared),
  ].join('/');
}
