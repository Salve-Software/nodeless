# Tooling

## Commands

| Command                           | What it does                                           |
| --------------------------------- | ------------------------------------------------------ |
| `npm run build`                   | compiles through `tsconfig.build.json` (`src/` only)   |
| `npm run typecheck`               | `tsc --noEmit`                                         |
| `npm run typecheck:fast`          | `tsgo --noEmit`, a local accelerator                   |
| `npm run lint` / `lint:fix`       | ESLint                                                 |
| `npm run format` / `format:check` | Prettier                                               |
| `npm test` / `test:watch`         | Vitest                                                 |
| `npm run example`                 | builds `example/app` in Node and writes the snapshot   |
| `npm run example:browser`         | serves the page running that same `dist/` in a browser |

## Two tsconfigs, and the second one is a guard

`tsconfig.json` covers `src/`, `example/` and the config files — it is what ESLint and
`typecheck` use, with Node's types available.

`tsconfig.build.json` narrows to `src/`, excludes `__tests__` and **turns on `types: []`**.
Without Node's types, any `import 'node:fs'` in `src/` stops compiling. **That is this
project's isomorphism guard**, and it is why `npm run build` runs in CI even though it is not
the artifact published there.

The second guard is ESLint's `no-restricted-imports`, relaxed only in `__tests__/`, `example/`
and `*.config.ts`.

**Two options that change how the code gets written:**

- **`noUncheckedIndexedAccess`**: `table[i]` is `T | undefined`. Prefer `for...of`, `find` and
  `??` over raw indexing.
- **`lib: ["ES2023", "DOM", "DOM.Iterable"]`**: this is where `fetch`, `TextEncoder`, `btoa` and
  `setTimeout` come from. Those are the globals that exist on both sides — do not use any other.

## Two compilers

| Package                      | Role                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `typescript` 5.9             | **source of truth**: build, `typecheck` and under ESLint    |
| `@typescript/native-preview` | TypeScript 7 as `tsgo`, only a `typecheck:fast` accelerator |

The TS 7 package is a thin wrapper over the Go binary and **does not expose the JS API**, which
is where `typescript-eslint` gets its type-aware rules — and those are what enforce
`max-params`, `member-ordering`, `consistent-type-imports` and the `../` ban. When touching
`tsconfig.json`, run both and check they agree; when they disagree, `tsc` wins.

## Absolute imports

`@/*` → `./src/*` and `@example/*` → `./example/*`. Four places know about the aliases:

| Where    | How                                                |
| -------- | -------------------------------------------------- |
| `tsc`    | `paths` in `tsconfig.json`                         |
| `dist/`  | `tsc-alias` rewrites them to relative during build |
| `vitest` | `resolve.alias` in `vitest.config.ts`              |
| `eslint` | `eslint-import-resolver-typescript` reads `paths`  |

`tsc` does **not** rewrite aliases in its output — without `tsc-alias`, `dist/` would ship a
literal `@/` and break for consumers. Here that would be worse than usual: `dist/` is loaded
directly by the browser in `example/browser`, with no bundler to patch it up.

## The dist has to stay clean

After `npm run build`, `dist/` may hold exactly two bare imports: `esbuild-wasm` and
`resolve.exports`. That is what lets the browser page resolve everything through an import map
with no bundling step.

```bash
grep -rhoE "from '[^.'][^']*'" dist | sort -u
```

Adding a third runtime dependency means adding an entry to the import map in
`example/browser/index.html` and a line in the README. Think twice.

## Prettier and ESLint

Prettier is the single source of formatting; ESLint does not format. Semicolons, quotes and
width are adjusted **in `.prettierrc.json`**, never in ESLint.

The rules that back the structure rules: `max-params: 2`, `member-ordering`,
`consistent-type-imports`, `import-x/order` with the `type` group on top, `../` banned by regex,
and `no-restricted-imports` over Node builtins.

## Husky

`pre-commit` runs `lint-staged`, which applies `prettier --write` to whatever is staged. ESLint
**does not** run in the hook — CI covers it.

## CI

`.github/workflows/ci.yml`, two jobs.

**`verify`** runs on every PR and every push: lint, typecheck, format, test, build and
`npm run example`. The example is the end-to-end smoke test — it builds the real React scaffold
and fails if the warm build goes over 500 ms.

**`release`** runs **only on a push to `main`**, depends on `verify`, and fires semantic-release.

## Semantic release

Versions the package from conventional commits and **publishes to npm**
(`@salve-software/nodeless`, public scope). It needs `NPM_TOKEN` in the repository secrets.

| Commit                               | Effect |
| ------------------------------------ | ------ |
| `feat: ...`                          | minor  |
| `fix: ...`                           | patch  |
| `BREAKING CHANGE: ...` footer        | major  |
| `docs:`, `test:`, `chore:`, `build:` | none   |

`cleanup:` and `remove:` are ignored by the analyzer; if the change breaks the contract, use the
`BREAKING CHANGE:` footer.

## Dependabot

Weekly, npm and github-actions. DevDependencies come grouped with the `chore` prefix and do not
cut a release. **Runtime dependencies come on their own with the `fix` prefix** — `esbuild-wasm`
and `resolve.exports` change the behaviour of the published package, and a major bump in either
can break resolution for a real package without breaking a single test.
