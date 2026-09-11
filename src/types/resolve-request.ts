/** A specifier to resolve. `importer` is empty when the specifier is an entry point. */
export interface ResolveRequest {
  specifier: string;
  importer: string;
}
