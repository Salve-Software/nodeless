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
| `npm run example`                 | builds `example/app` in Node, offline                  |
| `npm run example:install`         | installs from the real registry and builds the result  |
| `npm run example:tailwind`        | builds a Tailwind v4 project through the css transform |
| `npm run playground`              | opens the editor-and-preview page in your browser      |
| `npm run example:browser:test`    | drives that page headless and asserts it really works  |

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

After `npm run build`, `dist/` may hold exactly four bare imports: `esbuild-wasm`,
`resolve.exports`, `semver` and `fflate`. That is what lets the browser page resolve everything
through an import map with no bundling step.

```bash
grep -rhoE "from '[^.'][^']*'" dist | sort -u
```

Adding a fifth runtime dependency means adding an entry to the import map in
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

**`verify`** runs on every PR and every push: lint, typecheck, format, test, build,
`npm run example` and `npm run example:install`.

The first example is the offline smoke test — it builds the real React scaffold and fails if the
warm build goes over `BUILD_BUDGET_MS`, which is loose because a runner is several times
slower than a laptop. The second is the only end-to-end proof of the installer: it really
talks to registry.npmjs.org and really bundles Radix, lucide, zustand and react-router. It is
also the only step in CI that needs the network.

**`browser`** installs Chromium and drives the playground headlessly: it checks that the page
installs from the registry over CORS, builds, and that the **iframe really executes the bundle** —
React mounts, state updates on click, an edit rebuilds, and a syntax error comes back as a
diagnostic. It is the only proof that the browser half of "isomorphic" is real.

Nothing in `ci.yml` publishes. Releasing is its own workflow, and it is manual.

## Releasing

`.github/workflows/release.yml`, **`workflow_dispatch` only**. Merging to `main` never publishes;
someone decides to. It takes a `dry-run` input that works out the next version and stops.

It re-runs lint, typecheck, format, test and build before releasing. CI already ran on the
commit, but a dispatch can target any ref, and shipping something unverified is the one mistake
that reaches other people.

### There is no npm token

Publishing goes through **npm trusted publishing**: the workflow asks GitHub for an OIDC token
and npm exchanges it for a short-lived credential. `id-token: write` is what makes that possible,
and it is the whole configuration on this side. Provenance comes along for free.

Two things have to line up, and both live on npmjs.com rather than here:

- the package has a trusted publisher configured for this repository **and the workflow filename
  `release.yml`** — renaming the file breaks publishing;
- npm CLI **11.5.1 or newer**, which is why the workflow upgrades npm. Node 22 ships npm 10.

### Versions come from the commits

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
cut a release. **Runtime dependencies come on their own with the `fix` prefix** — `esbuild-wasm`,
`resolve.exports`, `semver` and `fflate` change the behaviour of the published package, and a
major bump in any of them can break a real install or a real build without breaking one test.
