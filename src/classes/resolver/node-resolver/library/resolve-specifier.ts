import type {
  PackageScope,
  ResolveScope,
} from '@/classes/resolver/node-resolver/types/index.js';
import type { ResolveRequest, ResolveResult } from '@/types/index.js';
import { ROOT_PATH } from '@/constants/index.js';
import { ResolveError } from '@/errors/index.js';
import { dirname, joinPath, normalizePath } from '@/library/index.js';
import { applyBrowserAlias } from './apply-browser-alias.js';
import { applyBrowserRedirect } from './apply-browser-redirect.js';
import { findPackageScope } from './find-package-scope.js';
import { isBuiltinModule } from './is-builtin-module.js';
import { isRelativeSpecifier } from './is-relative-specifier.js';
import { loadAsDirectory } from './load-as-directory.js';
import { loadAsFile } from './load-as-file.js';
import { nodeModulesDirs } from './node-modules-dirs.js';
import { parseSpecifier } from './parse-specifier.js';
import { resolveInPackage } from './resolve-in-package.js';

/** Node's resolution algorithm over the VFS. Synchronous, because the VFS is. */
export function resolveSpecifier(
  scope: ResolveScope,
  { specifier, importer }: ResolveRequest,
): ResolveResult {
  const fromDir = importer === '' ? ROOT_PATH : dirname(importer);

  if (isRelativeSpecifier(specifier) || specifier.startsWith('/')) {
    const target = specifier.startsWith('/')
      ? normalizePath(specifier)
      : joinPath(fromDir, specifier);
    const path = loadAsFile(scope, target) ?? loadAsDirectory(scope, target);

    if (path === undefined) throw unresolved({ specifier, importer });

    return overrideFile(scope, path);
  }

  if (isBuiltinModule(specifier)) {
    return {
      kind: 'empty',
      reason: `"${specifier}" is a Node builtin and has no browser equivalent`,
    };
  }

  const owner = findPackageScope(scope, fromDir);
  const alias = owner ? applyBrowserAlias(scope, { owner, specifier }) : undefined;

  if (owner && alias) {
    if (alias.kind === 'empty') {
      return { kind: 'empty', reason: browserFalseReason({ specifier, owner }) };
    }
    if (isRelativeSpecifier(alias.specifier)) {
      return resolveSpecifier(scope, {
        specifier: alias.specifier,
        importer: joinPath(owner.dir, 'package.json'),
      });
    }
  }

  const wanted = alias?.kind === 'redirect' ? alias.specifier : specifier;
  const { name, subpath } = parseSpecifier(wanted);

  for (const dir of nodeModulesDirs(fromDir)) {
    const packageDir = joinPath(dir, name);
    const manifest = scope.readManifest(packageDir);

    if (manifest === undefined) continue;

    const path = resolveInPackage(scope, { packageDir, manifest, subpath });

    if (path !== undefined) return overrideFile(scope, path);
  }

  throw unresolved({ specifier: wanted, importer });
}

/** Lives here because it calls `resolveSpecifier` back; a separate file would be circular. */
function overrideFile(scope: ResolveScope, path: string): ResolveResult {
  const owner = findPackageScope(scope, dirname(path));
  const mapping = owner ? applyBrowserRedirect(scope, { owner, path }) : undefined;

  if (!mapping || !owner) return { kind: 'file', path };
  if (mapping.kind === 'empty') {
    return { kind: 'empty', reason: browserFalseReason({ specifier: path, owner }) };
  }

  const redirected = resolveSpecifier(scope, {
    specifier: mapping.specifier,
    importer: joinPath(owner.dir, 'package.json'),
  });

  // A map entry pointing at its own file would recurse forever.
  return redirected.kind === 'file' && redirected.path === path
    ? { kind: 'file', path }
    : redirected;
}

function browserFalseReason({
  specifier,
  owner,
}: {
  specifier: string;
  owner: PackageScope;
}): string {
  return `"${specifier}" is mapped to false by the browser field of ${owner.manifest.name ?? owner.dir}`;
}

function unresolved({ specifier, importer }: ResolveRequest): ResolveError {
  return new ResolveError(
    `Cannot resolve "${specifier}" from ${importer === '' ? '<entry point>' : importer}`,
    { specifier, importer },
  );
}
