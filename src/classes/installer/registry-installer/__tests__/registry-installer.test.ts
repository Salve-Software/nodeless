import { describe, expect, it } from 'vitest';
import { RegistryInstaller } from '@/classes/installer/index.js';
import {
  createRegistry,
  REGISTRY_ORIGIN,
  rootManifest,
} from '@/classes/installer/registry-installer/__tests__/registry.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

async function install(
  packages: Parameters<typeof createRegistry>[0],
  deps: Record<string, string>,
) {
  const vfs = new MemoryVfs({ files: rootManifest(deps) });
  const registry = await createRegistry(packages);
  const installer = new RegistryInstaller({
    vfs,
    registryUrl: REGISTRY_ORIGIN,
    fetch: registry.fetch,
  });

  return { vfs, registry, result: await installer.install() };
}

describe('RegistryInstaller', () => {
  it('writes the package into the root node_modules', async () => {
    const { vfs, result } = await install([{ name: 'left-pad', version: '1.3.0' }], {
      'left-pad': '^1.0.0',
    });

    expect(result.installed).toEqual({ 'left-pad': '1.3.0' });
    expect(vfs.readText('/node_modules/left-pad/index.js')).toContain('left-pad');
    expect(vfs.readText('/node_modules/left-pad/package.json')).toContain('"1.3.0"');
  });

  it('picks the highest version the range allows', async () => {
    const { result } = await install(
      [
        { name: 'p', version: '1.0.0' },
        { name: 'p', version: '1.9.2' },
        { name: 'p', version: '2.0.0' },
      ],
      { p: '^1.0.0' },
    );

    expect(result.installed['p']).toBe('1.9.2');
  });

  it('follows transitive dependencies', async () => {
    const { vfs, result } = await install(
      [
        { name: 'a', version: '1.0.0', dependencies: { b: '^2.0.0' } },
        { name: 'b', version: '2.1.0', dependencies: { c: '^3.0.0' } },
        { name: 'c', version: '3.0.1' },
      ],
      { a: '^1.0.0' },
    );

    expect(result.installed).toEqual({ a: '1.0.0', b: '2.1.0', c: '3.0.1' });
    expect(vfs.exists('/node_modules/c/index.js')).toBe(true);
  });

  it('hoists a shared dependency instead of installing it twice', async () => {
    const { vfs } = await install(
      [
        { name: 'a', version: '1.0.0', dependencies: { shared: '^1.0.0' } },
        { name: 'b', version: '1.0.0', dependencies: { shared: '^1.0.0' } },
        { name: 'shared', version: '1.2.0' },
      ],
      { a: '^1.0.0', b: '^1.0.0' },
    );

    expect(vfs.exists('/node_modules/shared')).toBe(true);
    expect(vfs.exists('/node_modules/a/node_modules/shared')).toBe(false);
  });

  // The layout npm produces when two dependents disagree; the resolver already reads it.
  it('nests the loser of a version conflict under its dependent', async () => {
    const { vfs } = await install(
      [
        { name: 'modern', version: '1.0.0', dependencies: { dep: '^2.0.0' } },
        { name: 'legacy', version: '1.0.0', dependencies: { dep: '^1.0.0' } },
        { name: 'dep', version: '1.5.0' },
        { name: 'dep', version: '2.0.0' },
      ],
      { modern: '^1.0.0', legacy: '^1.0.0' },
    );

    expect(vfs.readText('/node_modules/dep/package.json')).toContain('"2.0.0"');
    expect(vfs.readText('/node_modules/legacy/node_modules/dep/package.json')).toContain(
      '"1.5.0"',
    );
  });

  it('survives a dependency cycle', async () => {
    const { result } = await install(
      [
        { name: 'a', version: '1.0.0', dependencies: { b: '^1.0.0' } },
        { name: 'b', version: '1.0.0', dependencies: { a: '^1.0.0' } },
      ],
      { a: '^1.0.0' },
    );

    expect(result.installed).toEqual({ a: '1.0.0', b: '1.0.0' });
  });

  it('fetches each packument once even with several dependents', async () => {
    const { registry } = await install(
      [
        { name: 'a', version: '1.0.0', dependencies: { shared: '^1.0.0' } },
        { name: 'b', version: '1.0.0', dependencies: { shared: '^1.0.0' } },
        { name: 'shared', version: '1.0.0' },
      ],
      { a: '^1.0.0', b: '^1.0.0' },
    );

    expect(registry.requests.filter((url) => url.endsWith('/shared'))).toHaveLength(1);
  });

  it('warns about an unsatisfied peer instead of installing it', async () => {
    const { vfs, result } = await install(
      [{ name: 'plugin', version: '1.0.0', peerDependencies: { host: '^3.0.0' } }],
      { plugin: '^1.0.0' },
    );

    expect(result.warnings).toEqual([
      'plugin@1.0.0 wants peer host@^3.0.0, which is not installed',
    ]);
    expect(vfs.exists('/node_modules/host')).toBe(false);
  });

  it('writes a lockfile keyed by install directory', async () => {
    const { vfs, result } = await install([{ name: 'p', version: '1.0.0' }], {
      p: '^1.0.0',
    });

    expect(result.lockfile.packages['node_modules/p']).toMatchObject({
      version: '1.0.0',
    });
    expect(vfs.readText('/nodeless-lock.json')).toContain('node_modules/p');
  });

  // One unresolvable package used to abort the whole install; now it is reported.
  it('a package the registry does not have is reported, not fatal', async () => {
    const { result } = await install([], { missing: '^1.0.0' });

    expect(result.installed).toEqual({});
    expect(result.warnings.join()).toContain('missing');
  });

  it('a project with no package.json fails clearly', async () => {
    const installer = new RegistryInstaller({ vfs: new MemoryVfs() });

    await expect(installer.install()).rejects.toThrow(/No \/package\.json/);
  });
});

describe('RegistryInstaller, devDependencies', () => {
  const packages = [
    { name: 'runtime', version: '1.0.0' },
    { name: 'tailwindcss', version: '4.0.0' },
  ];

  async function installWith(dev: boolean) {
    const vfs = new MemoryVfs({
      files: {
        '/package.json': JSON.stringify({
          name: 'app',
          dependencies: { runtime: '^1.0.0' },
          devDependencies: { tailwindcss: '^4.0.0' },
        }),
      },
    });
    const registry = await createRegistry(packages);
    const installer = new RegistryInstaller({
      vfs,
      registryUrl: REGISTRY_ORIGIN,
      fetch: registry.fetch,
    });

    return { vfs, result: await installer.install({ dev }) };
  }

  it('leaves devDependencies alone by default', async () => {
    const { result } = await installWith(false);

    expect(Object.keys(result.installed)).toEqual(['runtime']);
  });

  // A Vite project keeps tailwindcss there, and the CSS cannot resolve without it.
  it('installs them when asked', async () => {
    const { vfs, result } = await installWith(true);

    expect(Object.keys(result.installed).sort()).toEqual(['runtime', 'tailwindcss']);
    expect(vfs.exists('/node_modules/tailwindcss/package.json')).toBe(true);
  });
});

describe('RegistryInstaller, workspaces', () => {
  const files = {
    '/package.json': JSON.stringify({
      name: 'root',
      workspaces: ['packages/*'],
      dependencies: { '@local/types': '*', published: '^1.0.0' },
    }),
    '/packages/types/package.json': JSON.stringify({
      name: '@local/types',
      version: '2.3.0',
      dependencies: { published: '^1.0.0' },
    }),
    '/packages/types/index.ts': 'export type Id = string;',
  };

  async function installWorkspace() {
    const vfs = new MemoryVfs({ files });
    const registry = await createRegistry([{ name: 'published', version: '1.4.0' }]);
    const installer = new RegistryInstaller({
      vfs,
      registryUrl: REGISTRY_ORIGIN,
      fetch: registry.fetch,
    });

    return { vfs, registry, result: await installer.install() };
  }

  // Going to the registry for a package that lives in the repository gets a 404.
  it('takes a workspace package from the VFS instead of the registry', async () => {
    const { vfs, registry, result } = await installWorkspace();

    expect(result.installed['@local/types']).toBe('2.3.0');
    expect(vfs.readText('/node_modules/@local/types/index.ts')).toContain(
      'export type Id',
    );
    expect(registry.requests.some((url) => url.includes('%2ftypes'))).toBe(false);
  });

  it('still walks what the workspace package depends on', async () => {
    const { result } = await installWorkspace();

    expect(result.installed['published']).toBe('1.4.0');
  });
});

describe('RegistryInstaller, an unresolvable package', () => {
  // It used to abort the whole install, so one private package cost you the other twelve.
  it('becomes a warning and the rest still installs', async () => {
    const vfs = new MemoryVfs({
      files: {
        '/package.json': JSON.stringify({
          dependencies: { '@private/thing': '*', good: '^1.0.0' },
        }),
      },
    });
    const registry = await createRegistry([{ name: 'good', version: '1.0.0' }]);
    const result = await new RegistryInstaller({
      vfs,
      registryUrl: REGISTRY_ORIGIN,
      fetch: registry.fetch,
    }).install();

    expect(Object.keys(result.installed)).toEqual(['good']);
    expect(result.warnings.join()).toContain('@private/thing');
    expect(vfs.exists('/node_modules/good')).toBe(true);
  });

  it('a range nothing satisfies is a warning too, not a crash', async () => {
    const vfs = new MemoryVfs({
      files: { '/package.json': JSON.stringify({ dependencies: { p: '^9.0.0' } }) },
    });
    const registry = await createRegistry([{ name: 'p', version: '1.0.0' }]);
    const result = await new RegistryInstaller({
      vfs,
      registryUrl: REGISTRY_ORIGIN,
      fetch: registry.fetch,
    }).install();

    expect(result.installed).toEqual({});
    expect(result.warnings.join()).toContain('p@^9.0.0');
  });
});
