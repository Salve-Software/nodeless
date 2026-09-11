import type { FileInput } from '@/types/index.js';
import { bytesToBase64 } from '@/library/index.js';
import { buildTarball } from './tarball.js';

export interface FakePackage {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  files?: Record<string, string>;
}

export interface FakeRegistry {
  fetch: typeof fetch;
  requests: string[];
}

const ORIGIN = 'https://registry.test';

/** A registry served from memory, so the installer is testable without the network. */
export async function createRegistry(packages: FakePackage[]): Promise<FakeRegistry> {
  const packuments = new Map<string, Record<string, unknown>>();
  const tarballs = new Map<string, Uint8Array>();
  const requests: string[] = [];

  for (const pkg of packages) {
    const tarball = buildTarball(entriesOf(pkg));
    const url = `${ORIGIN}/${pkg.name}/-/tarball-${pkg.version}.tgz`;

    tarballs.set(url, tarball);

    const packument = packuments.get(pkg.name) ?? {
      name: pkg.name,
      'dist-tags': {},
      versions: {},
    };
    const versions = packument['versions'] as Record<string, unknown>;

    versions[pkg.version] = {
      version: pkg.version,
      ...(pkg.dependencies ? { dependencies: pkg.dependencies } : {}),
      ...(pkg.peerDependencies ? { peerDependencies: pkg.peerDependencies } : {}),
      dist: { tarball: url, integrity: await integrityOf(tarball) },
    };
    (packument['dist-tags'] as Record<string, string>)['latest'] = pkg.version;
    packuments.set(pkg.name, packument);
  }

  const fetchImpl = async (input: RequestInfo | URL): Promise<Response> => {
    const url = urlOf(input);

    requests.push(url);

    const tarball = tarballs.get(url);

    if (tarball) return new Response(tarball as BlobPart, { status: 200 });

    const name = decodeURIComponent(url.slice(`${ORIGIN}/`.length));
    const packument = packuments.get(name);

    return packument
      ? new Response(JSON.stringify(packument), { status: 200 })
      : new Response('{"error":"Not found"}', { status: 404 });
  };

  return { fetch: fetchImpl, requests };
}

export const REGISTRY_ORIGIN = ORIGIN;

export function rootManifest(dependencies: Record<string, string>): FileInput {
  return { '/package.json': JSON.stringify({ name: 'app', dependencies }) };
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;

  return input instanceof URL ? input.href : input.url;
}

function entriesOf(pkg: FakePackage): { name: string; body: string }[] {
  const files = pkg.files ?? { 'index.js': `module.exports = '${pkg.name}';` };
  const manifest = JSON.stringify({
    name: pkg.name,
    version: pkg.version,
    main: 'index.js',
    ...(pkg.dependencies ? { dependencies: pkg.dependencies } : {}),
  });

  return [
    { name: 'package/package.json', body: manifest },
    ...Object.entries(files).map(([path, body]) => ({ name: `package/${path}`, body })),
  ];
}

async function integrityOf(tarball: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-512',
    tarball as Uint8Array<ArrayBuffer>,
  );

  return `sha512-${bytesToBase64(new Uint8Array(digest))}`;
}
