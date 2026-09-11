import type { TailwindApi } from './tailwind-api.js';

export interface TailwindTransformOptions {
  /** Inject the module yourself instead of letting the peer be imported by name. */
  tailwind?: TailwindApi;
}
