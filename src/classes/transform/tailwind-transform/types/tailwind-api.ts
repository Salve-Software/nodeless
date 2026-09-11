export interface TailwindStylesheet {
  path: string;
  base: string;
  content: string;
}

/** The slice of `tailwindcss` this uses, declared here so the peer can be absent. */
export interface TailwindApi {
  compile(
    css: string,
    options: {
      base: string;
      loadStylesheet: (id: string, base: string) => Promise<TailwindStylesheet>;
      // Tailwind passes a third argument this never reads.
      loadModule: (id: string) => Promise<never>;
    },
  ): Promise<{ build(candidates: string[]): string }>;
}
