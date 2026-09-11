import type { Server } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.tsx': 'text/plain; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
};

/** Serves the repository over HTTP so the browser example can be opened for real. */
export async function serveRepo(port: number): Promise<Server> {
  const server = createServer((request, response) => {
    // `normalize` collapses any `..`, so a request cannot climb out of the repository.
    const path = join(REPO_ROOT, normalize(decodeURIComponent(request.url ?? '/')));

    try {
      const target = statSync(path).isDirectory() ? join(path, 'index.html') : path;
      statSync(target);
      response.writeHead(200, {
        'content-type': TYPES[extname(target)] ?? 'application/octet-stream',
      });
      createReadStream(target).pipe(response);
    } catch {
      response.writeHead(404).end('not found');
    }
  });

  await new Promise<void>((done) => server.listen(port, '127.0.0.1', done));

  return server;
}
