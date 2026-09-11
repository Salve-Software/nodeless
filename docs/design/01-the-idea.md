# The idea

## The problem

Building a React project needs Node, a filesystem and a process. So anything that wants to build
on demand — a hosted playground, a documentation site with live examples, a preview service, an
editor embedded in a web app — provisions a container or a VM, copies the sources in, runs
`npm install && npm run build`, and copies the `dist/` back out.

That is cold start, cost, and shuffling files across a boundary, for something that is at bottom
a text transformation.

## What the VM was doing

Three things, and they are independent:

| Job                             | Needs a VM?                             |
| ------------------------------- | --------------------------------------- |
| a workspace to read and write   | no — a temp folder or a VFS does it     |
| `npm install` + `npm run build` | no — an in-process bundler does it      |
| isolating the code being built  | no — **bundling does not execute code** |

The third one is what matters. A React build is: read files → resolve every `import` down to
`node_modules` → transpile TSX to JS → concatenate → emit JS and CSS. **At no point does the
project's code run.** What runs is the browser that eventually loads the output — and there the
isolation already exists, and it belongs to the browser.

Installing is the same story: fetching a tarball and unpacking it does not execute anything
either, as long as you refuse to run lifecycle scripts. The sandbox was guarding a step that was
already inert.

The "Node runtime" that looked mandatory was not. esbuild does the whole job, and it has a WASM
build.

## `npm run dev` is not needed either

Preview is a build plus an iframe. An esbuild build of a React scaffold takes ~200 ms, and
rebuilding on every edit replaces the HMR dev server without anyone noticing. The library's
`watch()` is exactly that: observe the VFS, collapse the keystroke burst, call `build()` again.

## What this replaces

```
before   sources → container → npm install → npm run build → copy dist out
after    sources → VFS → install() → build() → dist, in memory, in process
```

No shell, no disk, no child process, no VM. The output is a `Record<string, Uint8Array>` that
never touched a filesystem.

## Why isomorphic instead of two libraries

Because both ends do the same thing. A server that builds for deployment and a browser that
builds for preview have to agree, and if they had different implementations of resolution or
bundling, the preview would lie about the deployment — the bug would only show up after
shipping. One codebase running on both sides is what guarantees that what you previewed is what
you shipped.
