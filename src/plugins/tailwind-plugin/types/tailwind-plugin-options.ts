import type { TailwindApi } from './tailwind-api.js';

/** `tailwind` skips the peer import, which is what a host with its own copy wants. */
export interface TailwindPluginOptions {
  tailwind?: TailwindApi;
}
