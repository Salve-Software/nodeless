export interface SassImporter {
  canonicalize(url: string): URL | null;
  load(url: URL): { contents: string; syntax: 'scss' | 'indented' | 'css' } | null;
}

/** The slice of `sass` this uses, declared here so the peer can be absent. */
export interface SassApi {
  compileString(
    source: string,
    options: {
      syntax: 'scss' | 'indented';
      /** Gives the entry a canonical URL, without which relative `@use` cannot resolve. */
      url: URL;
      /** Resolves relative loads from the entry; `importers` handles the bare ones. */
      importer: SassImporter;
      importers: SassImporter[];
    },
  ): { css: string };
}
