import { NodelessError } from './nodeless-error.class.js';

export class FileNotFoundError extends NodelessError {
  readonly code = 'file_not_found';
}
