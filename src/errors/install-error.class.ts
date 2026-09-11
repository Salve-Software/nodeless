import { NodelessError } from './nodeless-error.class.js';

export class InstallError extends NodelessError {
  readonly code = 'install_failed';
}
