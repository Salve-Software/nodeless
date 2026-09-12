import { describe, expect, it } from 'vitest';
import { nodeBootstrapSource } from '@/node/index.js';

describe('nodeBootstrapSource', () => {
  const source = nodeBootstrapSource('file:///dist/runtime-worker.js');

  it('is CommonJS, because `eval: true` runs a script and not a module', () => {
    expect(source).toContain("require('node:worker_threads')");
    expect(source).not.toMatch(/^import /m);
  });

  it('embeds the worker url as a literal', () => {
    expect(source).toContain('"file:///dist/runtime-worker.js"');
  });

  it('queues messages that arrive before the import settles', () => {
    expect(source).toContain('queue.push');
    expect(source).toContain('queue.splice(0)');
  });

  it('reports a failed boot instead of leaving the caller waiting', () => {
    expect(source).toContain('id: -1');
  });
});
