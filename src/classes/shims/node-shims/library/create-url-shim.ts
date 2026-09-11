import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';
import { FILE_SCHEME } from '@/classes/shims/node-shims/constants/index.js';

/** VFS paths travel as `file://` URLs, which is what `import.meta.url` has to look like. */
export function createUrlShim(): ShimModule {
  const fileURLToPath = (url: unknown): string => {
    const href = typeof url === 'string' ? url : String((url as URL).href);

    return href.startsWith(FILE_SCHEME)
      ? decodeURIComponent(href.slice(FILE_SCHEME.length)) || '/'
      : href;
  };

  const shim: ShimModule = {
    URL,
    URLSearchParams,
    fileURLToPath,
    pathToFileURL: (path: string) => new URL(`${FILE_SCHEME}${encodeURI(path)}`),
    format: (url: unknown) => String((url as URL).href ?? url),
    parse: (url: string) => new URL(url),
    resolve: (from: string, to: string) => new URL(to, from).href,
    domainToASCII: (domain: string) => domain,
    domainToUnicode: (domain: string) => domain,
  };

  shim['default'] = shim;

  return shim;
}
