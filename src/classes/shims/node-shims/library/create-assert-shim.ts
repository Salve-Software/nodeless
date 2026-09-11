import type { ShimModule } from '@/classes/shims/node-shims/types/index.js';

export function createAssertShim(): ShimModule {
  const ok = (value: unknown, message?: string): void => {
    if (!value) throw new Error(message ?? 'Assertion failed');
  };

  return Object.assign(ok, {
    ok,
    default: ok,
    equal: (a: unknown, b: unknown) => ok(a == b, `${String(a)} != ${String(b)}`),
    strictEqual: (a: unknown, b: unknown) => ok(a === b, `${String(a)} !== ${String(b)}`),
    deepStrictEqual: (a: unknown, b: unknown) =>
      ok(JSON.stringify(a) === JSON.stringify(b), 'not deeply equal'),
    notStrictEqual: (a: unknown, b: unknown) => ok(a !== b, 'unexpectedly equal'),
    fail: (message?: string) => ok(false, message),
  }) as unknown as ShimModule;
}
