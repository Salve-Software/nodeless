/** `null` means "not mine"; the next plugin gets asked. */
export type PluginResolveResult =
  string | { id: string; external?: boolean } | null | undefined;
