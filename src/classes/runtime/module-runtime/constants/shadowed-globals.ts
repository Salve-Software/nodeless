/**
 * Shadowed as parameters of the evaluated function, so a bare reference inside the config
 * resolves to the shim rather than to the host's. Without this, `process.env` in a config
 * is the env of whatever process is running the build — on a server, that is your secrets.
 */
export const SHADOWED_GLOBALS = ['process', 'require', 'module', 'exports'];
