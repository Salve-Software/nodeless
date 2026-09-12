import type { en } from './en';

export type Language = 'en' | 'pt-BR';

/**
 * `en` is declared `as const` so its shape is exact, which would otherwise make every string
 * its own literal type and demand that Portuguese say the same words. This widens the values
 * and keeps the shape, so a missing key is still an error and a translation is not.
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer Item)[]
        ? readonly Widen<Item>[]
        : { readonly [K in keyof T]: Widen<T[K]> };

export type Copy = Widen<typeof en>;
