import { describe, expect, it } from 'vitest';
import { renderIndexHtml } from '@/classes/bundler/esbuild-bundler/library/index.js';

const SCAFFOLD = `<!doctype html>
<html>
  <head>
    <title>app</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

describe('renderIndexHtml', () => {
  it('swaps the source script for the bundle one', () => {
    const html = renderIndexHtml(SCAFFOLD, { script: './bundle.js' });

    expect(html).not.toContain('/src/main.tsx');
    expect(html).toContain('<script type="module" src="./bundle.js"></script>');
  });

  it('injects the CSS into the head only when there is CSS', () => {
    expect(renderIndexHtml(SCAFFOLD, { script: './bundle.js' })).not.toContain(
      'stylesheet',
    );
    expect(
      renderIndexHtml(SCAFFOLD, { script: './bundle.js', style: './bundle.css' }),
    ).toContain('<link rel="stylesheet" href="./bundle.css" />');
  });

  it('leaves the rest of the document untouched', () => {
    const html = renderIndexHtml(SCAFFOLD, { script: './bundle.js' });

    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<title>app</title>');
  });

  it('a project without index.html gets a document carrying #root', () => {
    const html = renderIndexHtml(undefined, { script: './bundle.js' });

    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('./bundle.js');
  });

  it('HTML without a body gets the script appended at the end', () => {
    expect(renderIndexHtml('<div id="root"></div>', { script: './bundle.js' })).toContain(
      '<div id="root"></div><script type="module" src="./bundle.js"></script>',
    );
  });

  it('single quotes in the scaffold script are recognized too', () => {
    const html = renderIndexHtml(
      `<body><script type='module' src='/src/main.tsx'></script></body>`,
      { script: './bundle.js' },
    );

    expect(html).not.toContain('/src/main.tsx');
  });
});
