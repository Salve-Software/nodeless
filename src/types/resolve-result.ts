export type ResolveResult =
  | { kind: 'file'; path: string }
  | { kind: 'external'; specifier: string }
  | { kind: 'empty'; reason: string };
