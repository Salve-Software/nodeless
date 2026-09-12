import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// A plugin that reads the project through node:fs. There is no disk under it: the shim
// answers out of the VFS, which is why this works identically in a browser tab.
export default function bannerPlugin({ text }) {
  const manifest = JSON.parse(readFileSync(join('/', 'package.json'), 'utf8'));

  return {
    name: 'banner',
    transform(code, id) {
      // A legal comment, because esbuild drops every other kind on the way out.
      return id.endsWith('/src/main.tsx')
        ? `/*! ${text} — ${manifest.name} */\n${code}`
        : null;
    },
  };
}
