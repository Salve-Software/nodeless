import type { FunctionHandle } from '@/classes/runtime/worker-runtime/types/index.js';
import { FUNCTION_HANDLE_KEY } from '@/classes/runtime/worker-runtime/constants/index.js';

export function isFunctionHandle(value: unknown): value is FunctionHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FunctionHandle)[FUNCTION_HANDLE_KEY] === 'number'
  );
}
