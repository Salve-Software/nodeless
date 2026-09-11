# Contributing

## Setup

```bash
npm install
npm test
```

`npm run playground` opens the editor-and-preview page, which is the fastest way to see a change
end to end.

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
```

CI runs all of those plus three examples — one offline, one that installs from the real npm
registry, one that runs Tailwind through the css transform — and a headless Chromium job that
drives the playground.

## Branches and commits

Branches are `feat/<description>` or `fix/<description>`. Commits are
[conventional](https://www.conventionalcommits.org/): `feat`, `fix`, `docs`, `test`, `refactor`,
`style`, `chore`, `ci`, `build`.

The version is computed from those commits, so the type is not cosmetic: `feat` cuts a minor,
`fix` cuts a patch, a `BREAKING CHANGE:` footer cuts a major, and everything else cuts nothing.

Keep commits small and single-purpose. Never mix unrelated changes.

## How the code is expected to look

`.claude/rules/` is the real style guide, and it is short:

| Rule                                            | Where                     |
| ----------------------------------------------- | ------------------------- |
| module boundaries, ports, the invariants        | `rules/architecture.md`   |
| one class per folder, one type per file, naming | `rules/code-structure.md` |
| comments: one line or none                      | `rules/comments.md`       |
| what a test has to cover                        | `rules/testing.md`        |
| the two tsconfigs, CI, releasing                | `rules/tooling.md`        |

Two that catch people out:

- **`src/` cannot import a Node builtin.** The package runs in the browser too, and
  `tsconfig.build.json` compiles with `types: []` so a slip fails the build rather than someone's
  runtime.
- **Every function exported from a `library/` folder has a test.** The class exercises one path;
  the function has several.

## Why something is the way it is

`docs/design/` holds the decisions rather than the description — why bundling needs no VM, why
the VFS is synchronous, why a package with `exports` is sealed. Read it before arguing with a
constraint; most of them are load-bearing.

## Releasing

Manual, through `workflow_dispatch` on the `Release` workflow. Merging to `main` publishes
nothing.
