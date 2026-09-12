import { NodelessError } from './nodeless-error.class.js';

export class RuntimeError extends NodelessError {
  readonly code = 'runtime_failed';
}
