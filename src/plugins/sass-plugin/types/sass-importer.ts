/** Property syntax rather than methods: the object is handed to Sass and never rebound. */
export interface SassImporter {
  canonicalize: (url: string) => URL | null;
  load: (url: URL) => { contents: string; syntax: 'scss' | 'indented' | 'css' } | null;
}
