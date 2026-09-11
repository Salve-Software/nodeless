import type { BareSpecifier } from '@/types/index.js';

export function parseSpecifier(specifier: string): BareSpecifier {
  const segments = specifier.split('/');
  const name = specifier.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : (segments[0] ?? '');
  const rest = specifier.slice(name.length);

  return { name, subpath: rest === '' ? '.' : `.${rest}` };
}
