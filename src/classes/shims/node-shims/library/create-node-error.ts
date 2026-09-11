/** Packages branch on `err.code === 'ENOENT'`, so a shimmed failure has to carry one. */
export function createNodeError(
  code: string,
  { syscall, path }: { syscall: string; path: string },
): Error & { code: string; syscall: string; path: string } {
  const error = new Error(`${code}: ${syscall} '${path}'`) as Error & {
    code: string;
    syscall: string;
    path: string;
  };

  error.code = code;
  error.syscall = syscall;
  error.path = path;

  return error;
}
