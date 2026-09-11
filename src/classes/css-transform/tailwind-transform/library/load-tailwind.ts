import type { TailwindApi } from '@/classes/css-transform/tailwind-transform/types/index.js';
import { TAILWIND_ENTRY } from '@/classes/css-transform/tailwind-transform/constants/index.js';

// An optional peer: imported only once a stylesheet is found to need it.
let pending: Promise<TailwindApi> | undefined;

export async function loadTailwind(): Promise<TailwindApi> {
  pending ??= import(TAILWIND_ENTRY).then(
    (module) => module as TailwindApi,
    () => {
      pending = undefined;

      throw new Error(
        'This project uses Tailwind, which needs the `tailwindcss` package next to nodeless. ' +
          'Install it, or pass your own `cssTransform`.',
      );
    },
  );

  return pending;
}
