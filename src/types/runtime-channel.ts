import type { Disposer } from './disposer.js';

/**
 * A duplex message channel. A `Worker` is one; so is an in-process pair, which is how the
 * protocol is tested without a browser.
 */
export interface RuntimeChannel {
  post(message: unknown): void;
  listen(onMessage: (message: unknown) => void): Disposer;
  terminate(): void;
}
