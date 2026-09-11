# Resolver

The hard part. esbuild-wasm **has no filesystem**: every resolution goes through the plugin's
`onResolve`, which means reimplementing Node's algorithm over the VFS.

## The path of one resolution

```
resolveSpecifier(scope, { specifier, importer })
│
├─ relative or absolute? → loadAsFile → loadAsDirectory → browser field override
├─ Node builtin?         → empty module + warning
└─ bare
   ├─ browser field alias from the importer's package  ("fs": false)
   ├─ for each node_modules, nearest first, up to the root
   │   └─ resolveInPackage: exports  |  main/module/browser  |  subpath as a file path
   └─ nothing matched → ResolveError
```

## `exports` is sealed

A package that declares `exports` exposes only what is mapped. An undeclared subpath **does not
exist** and does **not** fall back to `main` — that is how Node and esbuild behave. Loosening it
here would make the library resolve imports that break in production, hiding the package's bug.

Reading the field is delegated to
[`resolve.exports`](https://github.com/lukeed/resolve.exports): it is small, correct, and
handles nested conditions, fallback arrays and wildcards. Reimplementing it would cost a week
and land somewhere worse.

Condition order: `browser`, `import`, `module`, `default`. `browser` comes first because the
target is the browser. **The array order decides nothing** — what decides is the key order
inside the package's own `exports`. The array only says which conditions are enabled.

## The `browser` field has two forms, and they are different things

| Form                                   | What it is              | Where it applies              |
| -------------------------------------- | ----------------------- | ----------------------------- |
| `"browser": "./b.js"`                  | alternative entry point | `resolveLegacyEntry`          |
| `"browser": { "fs": false }`           | package alias           | `applyBrowserAlias`, before   |
| `"browser": { "./node.js": "./b.js" }` | file override           | `applyBrowserRedirect`, after |

A bare key matches against the specifier **before** resolving; a relative key matches against
the **already resolved** file, because it is relative to the package root and not to the
importing file. Two different moments, hence two functions.

`false` becomes an empty module, not an error.

## A Node builtin becomes an empty module, not an error

`fs`, `path`, `crypto` and friends do not exist in the browser. A dependency importing `fs` on a
dead code path — which is common — must not take the user's build down. The resolver returns
`{ kind: 'empty', reason }`, the plugin loads `export default {}`, and a warning records the
readable reason.

If the code really uses the module, the error shows up at runtime in the iframe, with the build
warning as the clue. That beats a build that never completes.

## `./x.js` that is really `./x.ts`

In an ESM project TypeScript **tells you** to write `import './x.js'` for a file named `x.ts`.
Without rewriting the extension, no modern TypeScript scaffold resolves. The rule:

- try the exact path first — a real `.js` wins;
- then the extension list, `.tsx` before `.js`;
- last the rewrite: `.js` → `.ts`/`.tsx`, `.mjs` → `.mts`, `.cjs` → `.cts`.

## Hoisting and conflicting versions

`nodeModulesDirs` walks up from the importer's directory to the root building the candidate
list. Code inside `/node_modules/legacy/` finds `/node_modules/legacy/node_modules/react`
before `/node_modules/react` — exactly the layout npm produces when two dependencies ask for
incompatible versions of the same package.

## The cache, and why it must be invalidated

Reading and parsing the same `package.json` hundreds of times per build is expensive, so
`NodeResolver` caches per directory — including the negative result, which is the most frequent
case while walking up the `node_modules` chain.

But the resolver **does not watch the VFS**. Installing a dependency after the first build has
to work, which is why `build()` calls `invalidate()` before starting. There is a test for it.
