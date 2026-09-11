import type { BuildMessage } from '@/types/index.js';
import type { Message } from 'esbuild-wasm';
import { toBuildMessage } from './to-build-message.js';

/** esbuild throws an object carrying `errors`; anything else collapses into one message. */
export function toFailureMessages(error: unknown): BuildMessage[] {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const { errors } = error;

    if (Array.isArray(errors) && errors.length > 0) {
      return errors.map((message) => toBuildMessage(message as Message));
    }
  }

  return [{ text: error instanceof Error ? error.message : String(error) }];
}
