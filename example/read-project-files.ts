import type { FileInput } from '@/types/index.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '..');

/**
 * Phase 1 has no installer: the project's `node_modules` comes from the real packages
 * installed in this repository. Replacing this with `install()` is phase 2.
 */
export const VENDORED_PACKAGES = ['react', 'react-dom', 'scheduler'];

/** Reads a directory off disk into a `FileInput` under a POSIX prefix. */
export function readTree(dir: string, prefix: string): FileInput {
  const files: FileInput = {};

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const source = join(dir, entry.name);
    const target = `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      Object.assign(files, readTree(source, target));
      continue;
    }
    if (entry.isFile()) files[target] = new Uint8Array(readFileSync(source));
  }

  return files;
}

/** The `example/app` scaffold plus the packages it imports, ready for the VFS. */
export function readProjectFiles(): FileInput {
  const files = readTree(join(REPO_ROOT, 'example/app'), '');

  for (const name of VENDORED_PACKAGES) {
    Object.assign(
      files,
      readTree(join(REPO_ROOT, 'node_modules', name), `/node_modules/${name}`),
    );
  }

  return files;
}
