import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';
import { fromBuffer } from '@/classes/shims/nodeless-buffer/index.js';

export function createStringDecoderShim(): ShimModule {
  const StringDecoder = class {
    write(bytes: Uint8Array): string {
      return fromBuffer(bytes).toString('utf8');
    }

    end(): string {
      return '';
    }
  };

  return { StringDecoder, default: { StringDecoder } };
}
