import type { HtmlAssets } from '@/classes/bundler/esbuild-bundler/types/index.js';
import { HTML_TEMPLATE } from '@/classes/bundler/esbuild-bundler/constants/index.js';

// The scaffold points at the source (`/src/main.tsx`); the dist points at the bundle.
const MODULE_SCRIPT = /[ \t]*<script\b[^>]*\btype=(["'])module\1[^>]*>\s*<\/script>\n?/gi;

export function renderIndexHtml(
  template: string | undefined,
  { script, style }: HtmlAssets,
): string {
  const base = (template ?? HTML_TEMPLATE).replace(MODULE_SCRIPT, '');
  const withStyle = style
    ? insertBefore(base, {
        tag: '</head>',
        snippet: `<link rel="stylesheet" href="${style}" />`,
      })
    : base;

  return insertBefore(withStyle, {
    tag: '</body>',
    snippet: `<script type="module" src="${script}"></script>`,
  });
}

/** Inserts on the line above the closing tag, inheriting its indentation. */
function insertBefore(
  html: string,
  { tag, snippet }: { tag: string; snippet: string },
): string {
  const index = html.toLowerCase().indexOf(tag);

  if (index === -1) return `${html}${snippet}\n`;

  const lineStart = html.lastIndexOf('\n', index) + 1;
  const indent = html.slice(lineStart, index);

  return `${html.slice(0, lineStart)}${indent}  ${snippet}\n${html.slice(lineStart)}`;
}
