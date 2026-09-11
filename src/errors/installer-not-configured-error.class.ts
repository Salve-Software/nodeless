import { NodelessError } from './nodeless-error.class.js';

export class InstallerNotConfiguredError extends NodelessError {
  readonly code = 'installer_not_configured';
}
