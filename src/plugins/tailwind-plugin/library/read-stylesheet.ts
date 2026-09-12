import type { TailwindStylesheet } from '@/plugins/tailwind-plugin/types/index.js';
import type { Vfs } from '@/types/index.js';
import { dirname } from '@/library/index.js';

/**
 * The engine comes from the host, the stylesheets come from the project. Tailwind has to be
 * in the VFS for its own CSS to be readable, which means installing it like any dependency.
 */
export function readStylesheet(
  vfs: Vfs,
  { id, from, found }: { id: string; from: string; found: string | undefined },
): TailwindStylesheet {
  if (found === undefined || !vfs.exists(found)) {
    throw new Error(
      `Cannot find "${id}" imported from ${from}. ` +
        `If it is a devDependency, install it: install({ dev: ['${id}'] })`,
    );
  }

  return { path: found, base: dirname(found), content: vfs.readText(found) };
}
