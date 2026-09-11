import { describe, expect, it } from 'vitest';
import { RegistryInstaller } from '@/classes/installer/index.js';
import {
  createRegistry,
  REGISTRY_ORIGIN,
  rootManifest,
} from '@/classes/installer/registry-installer/__tests__/registry.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { InstallError } from '@/errors/index.js';

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

  it('a package the registry does not have fails with its name', async () => {
    await expect(install([], { missing: '^1.0.0' })).rejects.toThrow(/"missing"/);
  });

  it('a range no version satisfies fails', async () => {
    await expect(
      install([{ name: 'p', version: '1.0.0' }], { p: '^9.0.0' }),
    ).rejects.toThrow(InstallError);
  });

  it('a project with no package.json fails clearly', async () => {
    const installer = new RegistryInstaller({ vfs: new MemoryVfs() });

    await expect(installer.install()).rejects.toThrow(/No \/package\.json/);
  });
});
