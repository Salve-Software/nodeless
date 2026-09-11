# example

A real React project, built by nodeless on both sides — and a second one installed straight off
the registry.

```
example/
├── app/                    ← the offline project: react only, read from disk
├── install/                ← the networked project: radix, lucide, zustand, router, zod
├── read-project-files.ts   ← reads app/ + react/react-dom/scheduler into a FileInput
├── node/build.ts           ← npm run example
├── node/install.ts         ← npm run example:install
└── browser/index.html      ← npm run example:browser
```

**`app/` is also the test suite's fixture.** There is no copy: if the example stops building,
`npm test` and CI break with it. That is what keeps it from rotting — and what gives the tests
their value, because it is the actual React 19, with `exports`, `react-dom/client` and
`react/jsx-runtime`.

## Offline, in Node

```bash
npm run example
```

Builds the VFS from disk, builds the project, writes `example/node/dist/` and prints the sizes.
Then it recreates the project from a snapshot and checks the rebuild comes out byte for byte
identical. Fails if the warm build goes over 500 ms — acceptance criterion 6, and it runs in CI.

## From the real registry

```bash
npm run example:install
```

No `node_modules` anywhere. Reads `example/install/package.json`, installs 36 packages off
registry.npmjs.org in ~1.8 s, and bundles them in ~1.4 s. It asserts that every declared
dependency was installed and that each library really reached the output, so a silently empty
bundle cannot pass.

This is the only end-to-end proof of the installer, and the only step in CI that needs the
network.

## In the browser

```bash
npm run example:browser   # http://localhost:5173/example/browser/
```

Compiles the library and serves it statically. The page loads `dist/` directly, with no bundling
step: the four runtime dependencies arrive from a CDN through an import map.

It fetches its sources from `example/app`, **installs from registry.npmjs.org in the browser**,
and builds. Edit `App.tsx` in the textarea on the left and the iframe on the right rebuilds —
this is `npm run dev`, except the "dev server" is `watch()` plus `build()` in your own browser.
