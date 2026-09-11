# example

A real React project, built by nodeless on both sides.

```
example/
├── app/                    ← the user's React project
├── read-project-files.ts   ← reads app/ + react/react-dom/scheduler into a FileInput
├── node/build.ts           ← npm run example
└── browser/index.html      ← npm run example:browser
```

**`app/` is also the test suite's fixture.** There is no copy: if the example stops building,
`npm test` and CI break with it. That is what keeps it from rotting — and what gives the tests
their value, because it is the actual React 19, with `exports`, `react-dom/client` and
`react/jsx-runtime`.

## In Node

```bash
npm run example
```

Builds the VFS, runs the build, writes `example/node/dist/` and prints the sizes. It fails if
the warm build goes over 500 ms — that is acceptance criterion 6, and it runs in CI.

It also writes `example/browser/snapshot.json`: **the same snapshot an API would ship to the
front end**. That file is what the browser example consumes.

## In the browser

```bash
npm run example:browser   # http://localhost:5173/example/browser/
```

Compiles the library, writes the snapshot and serves it statically. The page loads `dist/`
directly, with no bundling step: the two runtime dependencies arrive from a CDN through an
import map.

Edit `App.tsx` in the textarea on the left and the iframe on the right rebuilds — this is
`npm run dev`, except the "dev server" is `watch()` plus `build()` in your own browser.

> `snapshot.json` comes out around 11 MB because it carries the whole `node_modules` as
> installed. What trims that is the phase 2 installer, which downloads only what `package.json`
> asks for.

## What the example does not use

`install()`. `node_modules` comes from this repository's own `node_modules`, read off disk by
`read-project-files.ts`. It is the only part of the flow that is not yet the final one.
