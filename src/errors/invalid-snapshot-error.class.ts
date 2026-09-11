import { NodelessError } from './nodeless-error.class.js';

export class InvalidSnapshotError extends NodelessError {
  readonly code = 'invalid_snapshot';
}
