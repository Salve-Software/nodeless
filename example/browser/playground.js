import * as esbuild from 'esbuild-wasm';
// Exactly the `dist/` that a Node API would consume. No bundling step on this page.
import { NodelessProject } from '../../dist/index.js';
import { STARTER } from './starter.js';

const CM = 'https://esm.sh';
const FILES = [
  '/src/App.tsx',
  '/src/main.tsx',
  '/src/app.css',
  '/vite.config.ts',
  '/index.html',
  '/package.json',
];
const LANGUAGE = { '.tsx': true, '.ts': true, '.js': true, '.jsx': true };

const ui = {
  status: document.getElementById('status'),
  build: document.getElementById('build'),
  auto: document.getElementById('auto'),
  tabs: document.getElementById('tabs'),
  editor: document.getElementById('editor'),
  previewHost: document.getElementById('preview-host'),
  placeholder: document.getElementById('placeholder'),
  meta: document.getElementById('meta'),
  diagnostics: document.getElementById('diagnostics'),
};

// Only the `codemirror` meta package is imported for anything stateful, and EditorView
// builds its own state. Importing @codemirror/state or @codemirror/view separately pins a
// different copy than the one bundled here, and the editor throws the moment you type.
const [
  { EditorView, basicSetup },
  { javascript },
  { css },
  { html },
  { json },
  { oneDark },
] = await Promise.all([
  import(`${CM}/codemirror@6.0.2`),
  import(`${CM}/@codemirror/lang-javascript@6.2.4`),
  import(`${CM}/@codemirror/lang-css@6.3.1`),
  import(`${CM}/@codemirror/lang-html@6.4.11`),
  import(`${CM}/@codemirror/lang-json@6.0.2`),
  import(`${CM}/@codemirror/theme-one-dark@6.1.3`),
]);

const project = new NodelessProject({
  files: STARTER,
  wasmURL: `https://unpkg.com/esbuild-wasm@${esbuild.version}/esbuild.wasm`,
});

let current = FILES[0];
let view;
let building = false;
let queued = false;
let installed = 0;

mount(current);
renderTabs();
bindEvents();

// ── install, then first build ──────────────────────────────────────────

setStatus('busy', 'installing from npm');

try {
  const result = await project.install();

  installed = Object.keys(result.installed).length;
  await build();
} catch (error) {
  setStatus('error', 'install failed');
  showDiagnostics(
    [{ text: String(error instanceof Error ? error.message : error) }],
    'error',
  );
}

// ── behaviour ──────────────────────────────────────────────────────────

function bindEvents() {
  ui.build.addEventListener('click', () => void build());

  project.watch(() => {
    if (ui.auto.checked) void build();
  });

  window.addEventListener('keydown', (event) => {
    const shortcut =
      (event.metaKey || event.ctrlKey) && (event.key === 'Enter' || event.key === 's');

    if (!shortcut) return;
    event.preventDefault();
    void build();
  });
}

/** One editor per file. Recreating it is cheaper than reconfiguring, and cannot drift. */
function mount(path) {
  view?.destroy();
  view = new EditorView({
    doc: project.vfs.readText(path),
    extensions: [
      basicSetup,
      oneDark,
      languageFor(path),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) project.vfs.writeFile(path, update.state.doc.toString());
      }),
    ],
    parent: ui.editor,
  });
}

function languageFor(path) {
  if (path.endsWith('.css')) return css();
  if (path.endsWith('.html')) return html();
  if (path.endsWith('.json')) return json();

  return LANGUAGE[path.slice(path.lastIndexOf('.'))]
    ? javascript({ jsx: true, typescript: true })
    : [];
}

function renderTabs() {
  ui.tabs.replaceChildren(
    ...FILES.map((path) => {
      const tab = document.createElement('button');

      tab.className = 'tab';
      tab.role = 'tab';
      tab.textContent = path.replace(/^\/(src\/)?/, '');
      tab.ariaSelected = String(path === current);
      tab.addEventListener('click', () => {
        current = path;
        mount(path);
        renderTabs();
        view.focus();
      });

      return tab;
    }),
  );
}

async function build() {
  if (building) {
    queued = true;
    return;
  }

  building = true;
  ui.build.disabled = true;
  setStatus('busy', 'building');

  const result = await project.build({ mode: 'development' });

  building = false;
  ui.build.disabled = false;

  if (result.ok) {
    setStatus('ok', `${result.durationMs} ms`);
    render(result.files);
    showDiagnostics(result.warnings, 'warn');
    setMeta(result);
  } else {
    setStatus(
      'error',
      `${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`,
    );
    showDiagnostics(result.errors, 'error');
  }

  if (queued) {
    queued = false;
    await build();
  }
}

/** The iframe cannot see the VFS, so the assets become Blob URLs inside the HTML. */
function render(files) {
  let markup = new TextDecoder().decode(files['index.html']);

  // The type matters: a module script is refused outright when the Blob has no MIME.
  const MIME = { 'bundle.js': 'text/javascript', 'bundle.css': 'text/css' };

  for (const [name, type] of Object.entries(MIME)) {
    if (!files[name]) continue;
    markup = markup.replace(
      `./${name}`,
      URL.createObjectURL(new Blob([files[name]], { type })),
    );
  }

  ui.placeholder?.remove();

  const frame = document.createElement('iframe');

  frame.id = 'preview';
  frame.title = 'preview';
  frame.srcdoc = markup;
  ui.previewHost.replaceChildren(frame);
}

function setStatus(state, text) {
  ui.status.dataset.state = state;
  ui.status.textContent = text;
}

function setMeta(result) {
  const size = (result.files['bundle.js']?.length ?? 0) / 1024;
  const styles = (result.files['bundle.css']?.length ?? 0) / 1024;

  ui.meta.innerHTML = [
    `<span><b>${installed}</b> packages installed</span>`,
    `<span>bundle.js <b>${size.toFixed(1)} kB</b></span>`,
    `<span>bundle.css <b>${styles.toFixed(1)} kB</b></span>`,
    `<span>built in <b>${result.durationMs} ms</b></span>`,
  ].join('');
}

function showDiagnostics(messages, kind) {
  ui.diagnostics.hidden = messages.length === 0;
  ui.diagnostics.replaceChildren(
    ...messages.map((message) => {
      const item = document.createElement('div');

      item.className = kind === 'warn' ? 'diagnostic warn' : 'diagnostic';

      const where = document.createElement('div');

      where.className = 'where';
      where.textContent = message.file
        ? `${message.file.replace(/^nodeless-vfs:/, '')}:${message.line ?? 0}:${message.column ?? 0}`
        : kind;

      const text = document.createElement('div');

      text.textContent = message.text;
      item.append(where, text);

      if (message.lineText) {
        const snippet = document.createElement('pre');

        snippet.textContent = message.lineText;
        item.append(snippet);
      }

      return item;
    }),
  );
}
