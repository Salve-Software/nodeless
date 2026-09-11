import type { RuntimeHost } from '@/classes/runtime/module-runtime/types/index.js';
import type { RuntimeModule } from '@/types/index.js';
import {
  HOST_GLOBAL,
  MODULE_GLOBAL,
} from '@/classes/runtime/module-runtime/constants/index.js';
import { toRuntimeError } from './to-runtime-error.js';

/**
 * `new Function` is the only evaluator that exists on both sides — a Worker is browser-only
 * and a data: URL import is blocked by CSP in the browser. Isolation does not come from here:
 * it comes from the bundle having no reachable builtin, decided before this line runs.
 */
export function evaluateModule({
  code,
  path,
  host,
}: {
  code: string;
  path: string;
  host: RuntimeHost;
}): RuntimeModule {
  // `sourceURL` is what puts the module's own name in a stack trace instead of `<anonymous>`.
  const body = `${code}\nreturn ${MODULE_GLOBAL};\n//# sourceURL=nodeless://${path}\n`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval -- the library's premise
    const factory = new Function(HOST_GLOBAL, body) as (
      host: RuntimeHost,
    ) => RuntimeModule;

    return factory(host);
  } catch (error) {
    throw toRuntimeError(error, path);
  }
}
