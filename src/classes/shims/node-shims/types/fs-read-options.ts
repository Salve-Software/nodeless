export type FsReadOptions =
  | string
  | { encoding?: string | null; withFileTypes?: boolean; throwIfNoEntry?: boolean }
  | null
  | undefined;
