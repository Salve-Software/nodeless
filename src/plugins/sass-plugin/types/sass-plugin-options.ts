import type { SassApi } from './sass-api.js';

/** `sass` skips the peer import, which is what a host with its own copy wants. */
export interface SassPluginOptions {
  sass?: SassApi;
}
