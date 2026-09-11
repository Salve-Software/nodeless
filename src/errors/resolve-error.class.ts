import { NodelessError } from './nodeless-error.class.js';

export class ResolveError extends NodelessError {
  readonly code = 'unresolved_import';
}
