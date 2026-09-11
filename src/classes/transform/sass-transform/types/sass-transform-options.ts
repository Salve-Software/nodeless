import type { SassApi } from './sass-api.js';

export interface SassTransformOptions {
  /** Inject the module yourself instead of letting the peer be imported by name. */
  sass?: SassApi;
}
