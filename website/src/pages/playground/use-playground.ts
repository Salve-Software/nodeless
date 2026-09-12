import { useCallback, useEffect, useRef, useState } from 'react';
import { NodelessProject } from '@salve-software/nodeless';
import type { BuildMessage } from '@salve-software/nodeless';
import { STARTER } from './starter';
import { toPreviewHtml } from './to-preview-html';

const WASM_URL = 'https://unpkg.com/esbuild-wasm@0.25.12/esbuild.wasm';

export type Phase = 'installing' | 'building' | 'ready' | 'failed';

export interface PlaygroundState {
  phase: Phase;
  durationMs: number;
  packages: number;
  errors: BuildMessage[];
  html: string;
}

/** Owns the project. Installing happens once; every edit after that is a rebuild. */
export function usePlayground(): PlaygroundState & {
  read: (path: string) => string;
  write: (path: string, content: string) => void;
} {
  const project = useRef<NodelessProject | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blobs = useRef<string[]>([]);
  const run = useRef(0);
  const [state, setState] = useState<PlaygroundState>({
    phase: 'installing',
    durationMs: 0,
    packages: 0,
    errors: [],
    html: '',
  });

  const build = useCallback(async () => {
    const current = project.current;

    if (!current) return;

    // An edit can land while a build is still running, and the older one must not win the race.
    const id = ++run.current;

    setState((previous) => ({ ...previous, phase: 'building' }));

    const result = await current.build({ mode: 'development' });

    if (id !== run.current) return;

    if (!result.ok) {
      setState((previous) => ({
        ...previous,
        phase: 'failed',
        errors: [...result.errors],
        durationMs: result.durationMs,
      }));

      return;
    }

    const preview = toPreviewHtml(result.files);

    for (const url of blobs.current) URL.revokeObjectURL(url);
    blobs.current = preview.urls;

    setState((previous) => ({
      ...previous,
      phase: 'ready',
      errors: [],
      durationMs: result.durationMs,
      html: preview.html,
    }));
  }, []);

  useEffect(() => {
    let disposed = false;
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const created = new NodelessProject({
      files: STARTER,
      wasmURL: WASM_URL,
      // The config in the editor is whatever the visitor typed, so it runs off the page.
      isolation: 'worker',
      workerUrl: `${window.location.origin}${base}/runtime-worker.js`,
    });

    project.current = created;

    void (async () => {
      const installed = await created.install();

      // StrictMode mounts twice, so this can resolve after its own project was thrown away.
      // Building then reaches project.current, which is the replacement, mid-install.
      if (disposed) return;

      setState((previous) => ({
        ...previous,
        packages: Object.keys(installed.installed).length,
      }));
      await build();
    })();

    return () => {
      disposed = true;

      for (const url of blobs.current) URL.revokeObjectURL(url);
      void created.dispose();
    };
  }, [build]);

  const read = useCallback(
    (path: string) => project.current?.vfs.readText(path) ?? '',
    [],
  );

  const write = useCallback(
    (path: string, content: string) => {
      project.current?.vfs.writeFile(path, content);

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void build(), 400);
    },
    [build],
  );

  return { ...state, read, write };
}
