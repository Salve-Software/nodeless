import { describe, expect, it } from 'vitest';
import { verifyIntegrity } from '@/classes/installer/registry-installer/library/index.js';
import { InstallError } from '@/errors/index.js';
import { bytesToBase64, textToBytes } from '@/library/index.js';

const bytes = textToBytes('tarball bytes');

async function integrityOf(algorithm: string, label: string): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, bytes as Uint8Array<ArrayBuffer>);

  return `${label}-${bytesToBase64(new Uint8Array(digest))}`;
}

describe('verifyIntegrity', () => {
  it('accepts bytes matching the published sha512', async () => {
    await expect(
      verifyIntegrity(bytes, await integrityOf('SHA-512', 'sha512')),
    ).resolves.toBeUndefined();
  });

  it('accepts sha256 and sha384 too', async () => {
    await expect(
      verifyIntegrity(bytes, await integrityOf('SHA-256', 'sha256')),
    ).resolves.toBeUndefined();
    await expect(
      verifyIntegrity(bytes, await integrityOf('SHA-384', 'sha384')),
    ).resolves.toBeUndefined();
  });

  it('rejects bytes that do not match', async () => {
    await expect(
      verifyIntegrity(textToBytes('tampered'), await integrityOf('SHA-512', 'sha512')),
    ).rejects.toThrow(InstallError);
  });

  // Unverifiable is tolerated; wrong is not. An old registry entry may carry no integrity.
  it('skips when the registry published none', async () => {
    await expect(verifyIntegrity(bytes, undefined)).resolves.toBeUndefined();
  });

  it('skips an algorithm it cannot compute', async () => {
    await expect(verifyIntegrity(bytes, 'sha1-abc')).resolves.toBeUndefined();
  });
});
