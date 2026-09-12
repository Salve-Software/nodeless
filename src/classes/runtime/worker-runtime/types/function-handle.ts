import type { FUNCTION_HANDLE_KEY } from '@/classes/runtime/worker-runtime/constants/index.js';

export type FunctionHandle = { [K in typeof FUNCTION_HANDLE_KEY]: number };
