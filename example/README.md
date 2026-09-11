# example

A real React project, built by nodeless on both sides — and a second one installed straight off
the registry.

```
example/
├── app/                    ← the offline project: react only, read from disk
├── install/                ← the networked project: radix, lucide, zustand, router, zod
├── tailwind/               ← the same scaffold, styled with tailwind v3
├── read-project-files.ts   ← reads app/ + react/react-dom/scheduler into a FileInput
├── node/build.ts           ← npm run example
├── node/install.ts         ← npm run example:install
├── node/tailwind.ts        ← npm run example:tailwind
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
identical. Fails if the warm build goes over `BUILD_BUDGET_MS` (2 s), which guards against a regression rather than against slow hardware.

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

## With Tailwind

```bash
npm run example:tailwind
```

Builds a Tailwind v4 project. The script passes **no options at all**: a stylesheet using
Tailwind directives is compiled because that is what the project asked for. 6.9 kB of utilities
in ~390 ms, with `@theme`, `@layer` and responsive variants.

The only requirement is that `tailwindcss` is in the VFS, like any other dependency. The engine
comes from the optional peer next to nodeless; the stylesheets come from the project.

## In the browser

```bash
npm run playground
```

Compiles the library, serves the repository and opens the page. A CodeMirror editor with file
tabs on the left, a live preview on the right, structured diagnostics underneath.

![the nodeless playground](../assets/playground.png)

The page loads `dist/` directly, with no bundling step: the four runtime dependencies arrive
from a CDN through an import map. It **installs from registry.npmjs.org in the browser**, builds
there, and renders the output in an iframe. Edit and it rebuilds — this is `npm run dev`, except
the "dev server" is `watch()` plus `build()` in your own tab.

### Verified, not claimed

```bash
npm run example:browser:test
```

Drives that same page in a headless Chromium and asserts six things: install runs against the
registry over CORS, build runs, the iframe **executes** the bundle, React state updates on a
click, an edit rebuilds and re-renders, and a syntax error comes back as a diagnostic carrying
`file:line:column`. It runs as its own CI job.

It does not touch the screenshot above unless you ask: `SCREENSHOT=1 npm run example:browser:test`.
Rewriting it on every run only changes the build time printed on screen, and left the tree dirty
for nothing.
