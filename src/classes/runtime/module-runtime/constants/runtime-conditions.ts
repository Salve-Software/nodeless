/**
 * The toolchain graph resolves as Node, not as a browser: a plugin's `node` entry is the
 * real one, and its `browser` entry is usually a stub meant for the app it builds.
 */
export const RUNTIME_CONDITIONS = ['node', 'import', 'module', 'require', 'default'];
