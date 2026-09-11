/** An absolute URL never goes through the VFS: the browser fetches it at runtime. */
const URL_SPECIFIER = /^(?:https?:|data:|blob:)/;

export function isExternalSpecifier(specifier: string, external: string[]): boolean {
  if (URL_SPECIFIER.test(specifier)) return true;

  return external.some(
    (entry) => specifier === entry || specifier.startsWith(`${entry}/`),
  );
}
