import { InstallError } from '@/errors/index.js';
import { bytesToBase64 } from '@/library/index.js';

const SUBRESOURCE = /^(sha256|sha384|sha512)-(.+)$/;
const ALGORITHMS: Record<string, string> = {
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
};

/** Registry tarballs are arbitrary bytes off the network. Unverifiable is fine; wrong is not. */
export async function verifyIntegrity(
  tarball: Uint8Array,
  integrity: string | undefined,
): Promise<void> {
  const match = integrity === undefined ? null : SUBRESOURCE.exec(integrity);
  const algorithm = match?.[1] === undefined ? undefined : ALGORITHMS[match[1]];

  if (!match || algorithm === undefined) return;

  const digest = await crypto.subtle.digest(
    algorithm,
    tarball as Uint8Array<ArrayBuffer>,
  );

  if (bytesToBase64(new Uint8Array(digest)) === match[2]) return;

  throw new InstallError('Tarball does not match the integrity the registry published', {
    integrity,
  });
}
