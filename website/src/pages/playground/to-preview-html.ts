const MIME: Record<string, string> = {
  'bundle.js': 'text/javascript',
  'bundle.css': 'text/css',
};

/**
 * The iframe cannot see the virtual filesystem, so the assets become Blob URLs inside the
 * markup. The MIME type matters: a module script is refused outright when the Blob has none.
 */
export function toPreviewHtml(files: Record<string, Uint8Array>): {
  html: string;
  urls: string[];
} {
  let html = new TextDecoder().decode(files['index.html']);
  const urls: string[] = [];

  for (const [name, type] of Object.entries(MIME)) {
    const bytes = files[name];

    if (!bytes) continue;

    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));

    urls.push(url);
    html = html.replace(`./${name}`, url);
  }

  return { html, urls };
}
