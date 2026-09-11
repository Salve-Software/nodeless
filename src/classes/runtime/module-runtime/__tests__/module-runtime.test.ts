import type { Runtime } from '@/types/index.js';
import { describe, expect, it } from 'vitest';
import { NodeResolver } from '@/classes/resolver/index.js';
import { ModuleRuntime } from '@/classes/runtime/index.js';
import { RUNTIME_CONDITIONS } from '@/classes/runtime/module-runtime/constants/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

function runtimeFor(files: Record<string, string>): Runtime {
  const vfs = new MemoryVfs({ files });

  return new ModuleRuntime({
    vfs,
    resolver: new NodeResolver({ vfs, conditions: RUNTIME_CONDITIONS }),
    cwd: '/project',
    env: { NODE_ENV: 'test' },
  });
}

describe('running a module out of the VFS', () => {
  it('returns the exports of an ESM module', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `export default { name: 'app' }; export const extra = 1;`,
    });
    const module = await runtime.import('/project/config.js');

    expect(module['default']).toEqual({ name: 'app' });
    expect(module['extra']).toBe(1);
  });

  it('follows a relative import', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { value } from './value.js'; export default value;`,
      '/project/value.js': `export const value = 42;`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe(42);
  });

  it('compiles TypeScript on the way in', async () => {
    const runtime = runtimeFor({
      '/project/config.ts': `const name: string = 'typed'; export default { name };`,
    });

    expect((await runtime.import('/project/config.ts'))['default']).toEqual({
      name: 'typed',
    });
  });
});

describe('the node builtins it sees', () => {
  it('gets the shim for node:path, not the real one', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { join } from 'node:path'; export default join('a', 'b');`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe('a/b');
  });

  it('reads the VFS through node:fs', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { readFileSync } from 'node:fs';
        export default readFileSync('/project/data.txt', 'utf8');`,
      '/project/data.txt': 'from the vfs',
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe('from the vfs');
  });

  it('accepts the bare name as well as the node: prefix', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import path from 'path'; export default path.sep;`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe('/');
  });

  it('reads process.env from the host', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `export default process.env.NODE_ENV;`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe('test');
  });

  it('imports a process-shaped builtin without failing the bundle', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { execSync } from 'node:child_process';
        export default () => execSync('ls');`,
    });
    const run = (await runtime.import('/project/config.js'))['default'] as () => void;

    expect(run).toBeTypeOf('function');
    expect(run).toThrowError(/in-process/);
  });
});

describe('the module globals an iife cannot provide', () => {
  it('gives import.meta.url the file own URL', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `export default import.meta.url;`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe(
      'file:///project/config.js',
    );
  });

  it('resolves fileURLToPath(import.meta.url) back to the VFS path', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { fileURLToPath } from 'node:url';
        export default fileURLToPath(import.meta.url);`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe(
      '/project/config.js',
    );
  });

  it('gives a CommonJS dependency its __dirname', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import dir from 'legacy'; export default dir;`,
      '/project/node_modules/legacy/package.json': `{"name":"legacy","version":"1.0.0","main":"index.js"}`,
      '/project/node_modules/legacy/index.js': `module.exports = __dirname;`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe(
      '/project/node_modules/legacy',
    );
  });
});

describe('CommonJS interop', () => {
  it('imports a CJS dependency as a default export', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import plugin from 'cjs-plugin'; export default plugin();`,
      '/project/node_modules/cjs-plugin/package.json': `{"name":"cjs-plugin","version":"1.0.0","main":"index.js"}`,
      '/project/node_modules/cjs-plugin/index.js': `module.exports = () => ({ name: 'cjs' });`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toEqual({
      name: 'cjs',
    });
  });

  it('imports a named export off a CJS dependency', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { make } from 'cjs-named'; export default make();`,
      '/project/node_modules/cjs-named/package.json': `{"name":"cjs-named","version":"1.0.0","main":"index.js"}`,
      '/project/node_modules/cjs-named/index.js': `exports.make = () => 'named';`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe('named');
  });

  it('lets a CJS dependency require another one', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import value from 'outer'; export default value;`,
      '/project/node_modules/outer/package.json': `{"name":"outer","version":"1.0.0","main":"index.js"}`,
      '/project/node_modules/outer/index.js': `module.exports = require('inner') + 1;`,
      '/project/node_modules/inner/package.json': `{"name":"inner","version":"1.0.0","main":"index.js"}`,
      '/project/node_modules/inner/index.js': `module.exports = 41;`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe(42);
  });

  it('honours the node condition over the browser one', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import value from 'dual'; export default value;`,
      '/project/node_modules/dual/package.json': `{"name":"dual","version":"1.0.0","exports":{".":{"browser":"./browser.js","node":"./node.js"}}}`,
      '/project/node_modules/dual/node.js': `export default 'node';`,
      '/project/node_modules/dual/browser.js': `export default 'browser';`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe('node');
  });
});

describe('caching', () => {
  it('evaluates a module once, so a plugin imported twice is the same instance', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `export default { id: Math.random() };`,
    });
    const [first, second] = await Promise.all([
      runtime.import('/project/config.js'),
      runtime.import('/project/config.js'),
    ]);

    expect(first['default']).toBe(second['default']);
  });

  it('re-evaluates after invalidate, because the VFS changes between builds', async () => {
    const vfs = new MemoryVfs({ files: { '/project/config.js': `export default 1;` } });
    const runtime = new ModuleRuntime({
      vfs,
      resolver: new NodeResolver({ vfs, conditions: RUNTIME_CONDITIONS }),
      cwd: '/project',
    });

    expect((await runtime.import('/project/config.js'))['default']).toBe(1);

    vfs.writeFile('/project/config.js', `export default 2;`);
    runtime.invalidate?.();

    expect((await runtime.import('/project/config.js'))['default']).toBe(2);
  });
});

describe('failures', () => {
  it('names the module when it throws while evaluating', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `throw new Error('boom');`,
    });

    await expect(runtime.import('/project/config.js')).rejects.toThrowError(
      /Failed to run \/project\/config\.js: boom/,
    );
  });

  it('reports an unresolved import instead of evaluating a broken bundle', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import 'nowhere'; export default 1;`,
    });

    await expect(runtime.import('/project/config.js')).rejects.toThrowError(/nowhere/);
  });
});

describe('the boundary', () => {
  it('cannot see the host filesystem, because the bundle holds no real builtin', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { existsSync } from 'node:fs';
        export default [existsSync('/etc/passwd'), existsSync('/project/config.js')];`,
    });

    expect((await runtime.import('/project/config.js'))['default']).toEqual([
      false,
      true,
    ]);
  });

  it('refuses a require it cannot have bundled', async () => {
    const runtime = runtimeFor({
      '/project/config.js': `import { createRequire } from 'node:module';
        export default () => createRequire(import.meta.url)('./nowhere.js');`,
    });
    const run = (await runtime.import('/project/config.js'))['default'] as () => void;

    expect(run).toThrowError(/only a static import/);
  });
});
