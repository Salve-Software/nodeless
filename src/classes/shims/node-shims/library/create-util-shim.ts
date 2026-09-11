import type { NodeCallback, ShimModule } from '@/classes/shims/node-shims/types/index.js';
import { stringifyValue } from './stringify-value.js';

export function createUtilShim(): ShimModule {
  const promisify =
    (fn: (...args: unknown[]) => unknown) =>
    async (...args: unknown[]) =>
      new Promise((resolve, reject) => {
        const done: NodeCallback = (error, value) => {
          if (!error) resolve(value);
          else reject(error instanceof Error ? error : new Error('callback failed'));
        };

        fn(...args, done);
      });

  const shim: ShimModule = {
    promisify,
    callbackify:
      (fn: (...args: unknown[]) => Promise<unknown>) =>
      (...args: unknown[]) => {
        const callback = args.pop() as NodeCallback;

        fn(...args).then(
          (value) => callback(null, value),
          (error: unknown) => callback(error),
        );
      },
    inherits: (child: { prototype: object }, parent: { prototype: object }) => {
      Object.setPrototypeOf(child.prototype, parent.prototype);
    },
    format: (...args: unknown[]) => args.map(stringifyValue).join(' '),
    inspect: stringifyValue,
    deprecate: (fn: unknown) => fn,
    isDeepStrictEqual: (a: unknown, b: unknown) =>
      JSON.stringify(a) === JSON.stringify(b),
    types: {
      isDate: (value: unknown) => value instanceof Date,
      isRegExp: (value: unknown) => value instanceof RegExp,
      isMap: (value: unknown) => value instanceof Map,
      isSet: (value: unknown) => value instanceof Set,
      isPromise: (value: unknown) => value instanceof Promise,
      isUint8Array: (value: unknown) => value instanceof Uint8Array,
      isTypedArray: (value: unknown) => ArrayBuffer.isView(value),
    },
    TextEncoder,
    TextDecoder,
  };

  shim['default'] = shim;

  return shim;
}
