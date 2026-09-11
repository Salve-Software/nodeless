import type { InstallScope } from '@/classes/installer/registry-installer/types/index.js';
import { describe, expect, it, vi } from 'vitest';
import { MemoryPackageCache } from '@/classes/installer/index.js';
import { fetchPackument } from '@/classes/installer/registry-installer/library/index.js';
import { MemoryVfs } from '@/classes/vfs/index.js';

function scopeWith(fetchImpl: typeof fetch): InstallScope {
  return {
    vfs: new MemoryVfs(),
    registryUrl: 'https://registry.test',
    fetch: fetchImpl,
    cache: new MemoryPackageCache(),
    packuments: new Map(),
    downloads: new Map(),
  };
}

const ok = () =>
  new Response('{"name":"p","dist-tags":{},"versions":{}}', { status: 200 });

describe('fetchPackument', () => {
  it('asks the registry for the abbreviated document', async () => {
    const fetchImpl = vi.fn(ok);
    const scope = scopeWith(fetchImpl as unknown as typeof fetch);

    await fetchPackument(scope, 'p');

    expect(fetchImpl).toHaveBeenCalledWith('https://registry.test/p', {
      headers: { accept: 'application/vnd.npm.install-v1+json' },
    });
  });

  // A scoped name carries a slash, which would otherwise read as another path segment.
  it('escapes the slash in a scoped name', async () => {
    const fetchImpl = vi.fn(ok);

    await fetchPackument(scopeWith(fetchImpl as unknown as typeof fetch), '@scope/pkg');

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://registry.test/@scope%2fpkg',
      expect.anything(),
    );
  });

  it('fetches once even when several dependents ask at the same time', async () => {
    const fetchImpl = vi.fn(ok);
    const scope = scopeWith(fetchImpl as unknown as typeof fetch);

    await Promise.all([fetchPackument(scope, 'p'), fetchPackument(scope, 'p')]);
    await fetchPackument(scope, 'p');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('a missing package fails with its name and the status', async () => {
    const scope = scopeWith(
      (() => new Response('', { status: 404 })) as unknown as typeof fetch,
    );

    await expect(fetchPackument(scope, 'gone')).rejects.toThrow(/404.*"gone"/);
  });

  // A cached rejection would poison every later attempt in the same run.
  it('does not cache a failure', async () => {
    const fetchImpl = vi
      .fn<() => Response>()
      .mockReturnValueOnce(new Response('', { status: 500 }))
      .mockReturnValue(ok());
    const scope = scopeWith(fetchImpl as unknown as typeof fetch);

    await expect(fetchPackument(scope, 'p')).rejects.toThrow();
    await expect(fetchPackument(scope, 'p')).resolves.toMatchObject({ name: 'p' });
  });
});
