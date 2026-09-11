import type { CdnOptions } from '@/types/index.js';
import { parseSpecifier } from '@/library/index.js';

/** `react-dom/client` becomes `https://esm.sh/react-dom@^19.0.0/client`. */
export function cdnSpecifier(
  specifier: string,
  { url, dependencies }: CdnOptions,
): string {
  const { name, subpath } = parseSpecifier(specifier);
  const range = dependencies?.[name];

  return `${url.replace(/\/+$/, '')}/${name}${range === undefined ? '' : `@${range}`}${
    subpath === '.' ? '' : subpath.slice(1)
  }`;
}
