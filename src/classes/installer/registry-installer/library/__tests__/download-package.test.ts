import type {
  InstallScope,
  PackumentVersion,
} from '@/classes/installer/registry-installer/types/index.js';
import { describe, expect, it, vi } from 'vitest';
import { MemoryPackageCache } from '@/classes/installer/index.js';
import { buildTarball } from '@/classes/installer/registry-installer/__tests__/tarball.js';
import { downloadPackage } from '@/classes/installer/registry-installer/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';
import { bytesToText, textToBytes } from '@/library/index.js';

const version: PackumentVersion = {
  version: '1.0.0',
  dist: { tarball: 'https://registry.test/p.tgz' },
};

function scopeWith(
  fetchImpl: typeof fetch,
  cache = new MemoryPackageCache(),
): InstallScope {
  return {
    vfs: new MemoryVfs(),
    registryUrl: 'https://registry.test',
    fetch: fetchImpl,
    cache,
    packuments: new Map(),
    downloads: new Map(),
    workspaces: new Map(),
  };
}

const serve = () =>
  new Response(buildTarball([{ name: 'package/index.js', body: 'ok' }]) as BlobPart, {
    status: 200,
  });

describe('downloadPackage', () => {
  it('downloads and extracts the tarball', async () => {
    const files = await downloadPackage(scopeWith(serve as unknown as typeof fetch), {
      name: 'p',
      version,
    });

    expect(bytesToText(files['index.js'] ?? new Uint8Array())).toBe('ok');
  });

  it('a cache hit skips the network entirely', async () => {
    const fetchImpl = vi.fn(serve);
    const cache = new MemoryPackageCache();

    await cache.set('p@1.0.0', { 'index.js': textToBytes('cached') });

    const files = await downloadPackage(
      scopeWith(fetchImpl as unknown as typeof fetch, cache),
      { name: 'p', version },
    );

    expect(bytesToText(files['index.js'] ?? new Uint8Array())).toBe('cached');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('fills the cache on a miss', async () => {
    const cache = new MemoryPackageCache();

    await downloadPackage(scopeWith(serve as unknown as typeof fetch, cache), {
      name: 'p',
      version,
    });

    expect(await cache.get('p@1.0.0')).toBeDefined();
  });

  // Two dependents asking at once must not pull the same tarball twice.
  it('downloads once for concurrent callers', async () => {
    const fetchImpl = vi.fn(serve);
    const scope = scopeWith(fetchImpl as unknown as typeof fetch);

    await Promise.all([
      downloadPackage(scope, { name: 'p', version }),
      downloadPackage(scope, { name: 'p', version }),
    ]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('a tarball that fails to download reports the status', async () => {
    const scope = scopeWith(
      (() => new Response('', { status: 503 })) as unknown as typeof fetch,
    );

    await expect(downloadPackage(scope, { name: 'p', version })).rejects.toThrow(/503/);
  });
});
