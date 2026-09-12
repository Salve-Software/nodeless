/** `createRequire` without a runtime behind it says so, rather than returning an empty module. */
export function missingRequire(specifier: string): never {
  throw new Error(
    `require("${specifier}") needs a runtime. Build NodeShims through ModuleRuntime rather than on their own.`,
  );
}
