/** Vite's `define` takes any JSON value; esbuild's takes source text, so every value is stringified. */
export function readConfigDefine(
  config: Record<string, unknown>,
): Record<string, string> {
  const declared = config['define'];

  if (typeof declared !== 'object' || declared === null) return {};

  const define: Record<string, string> = {};

  for (const [key, value] of Object.entries(declared)) {
    define[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }

  return define;
}
