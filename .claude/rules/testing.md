# Tests

Vitest, `node` environment. There is no separate integration suite: `EsbuildBundler` and
`NodelessProject` are exercised against the real esbuild-wasm, and that counts as unit testing
here — there is no external service to integrate with.

| Command              | What              |
| -------------------- | ----------------- |
| `npm test`           | everything        |
| `npm run test:watch` | everything, watch |

## `__tests__/` next to the code

```
node-resolver/
├── node-resolver.class.ts
├── __tests__/
│   ├── node-resolver.test.ts     ← tests the class
│   └── scope.ts                  ← a ResolveScope fake, not a test
└── library/
    ├── load-as-file.ts
    └── __tests__/load-as-file.test.ts
```

A test lives next to what it tests, not next to the folder that contains it. `__tests__` is
excluded from the build.

## Rules

- **No module mocking.** Hand-written fakes over the port: `createScope()` builds a
  `ResolveScope` on a real `MemoryVfs`; `installer` is an object with an `install` method. If a
  test needs `vi.mock`, a dependency has leaked.
- **Every function exported from `library/` has a test.** The class exercises one path; the
  function has several.
- **Every constant table has an edge test.** `RESOLVE_EXTENSIONS` has an order test — `.tsx`
  before `.js` — and `LOADERS` has an unknown-extension test.
- **Test names describe behaviour, not methods.** `'a sealed exports does not fall back to
main'`, never `'resolveInPackage() returns undefined'`.
- **Tests do not use the network.** Disk, yes: that is how `example/app` and the real React get
  into the VFS.

## The example is the fixture

`src/__tests__/nodeless-project.test.ts` builds the VFS from `readProjectFiles()`, which reads
`example/app` off disk plus the `react`, `react-dom` and `scheduler` packages from this
repository's `node_modules`. **There is no duplicated fixture**: if the example stops building,
the suite breaks, and `npm run example` in CI breaks with it.

It is also what gives the test real value — it is the actual React 19, with `exports`, the
`react-dom/client` subpath and `react/jsx-runtime`, not a complacent stub.

## What must always be covered

- **Structured errors.** Broken syntax, a nonexistent import and a missing entry all return
  `ok: false` with file and line, **without throwing**. That is the contract with the caller.
- **Nothing is executed.** The test writes `globalThis.<marker> = true` into the entry, builds,
  and checks that the marker made it into the bundle and does **not** exist on the process
  `globalThis`.
- **Snapshot round trip.** Binary bytes, an empty folder, an unknown version rejected, and a
  project recreated from the snapshot producing an identical bundle.
- **Resolver cache.** A dependency written into the VFS **after** the first build has to be
  visible on the second.
- **`build()` does not write to the VFS.** Otherwise `watch` would fire itself.
- **The `browser` field in both forms**: a bare key (`"fs": false`) and a relative key
  (`"./node.js": "./browser.js"`).

## Time

esbuild-wasm initializes once per process and takes a few seconds the first time — hence the
30 s `testTimeout` in `vitest.config.ts`. A test that needs more than that is doing too much.
