import { useState } from 'react';
import { Editor } from './editor';
import { StatusPill } from './status-pill';
import { usePlayground } from './use-playground';
import { FILE_ORDER } from './starter';
import { useCopy } from '@/i18n/use-copy';
import './playground.css';

export function Playground() {
  const { copy } = useCopy();
  const page = copy.playground;
  const { phase, durationMs, packages, errors, html, read, write } = usePlayground();
  const [file, setFile] = useState(FILE_ORDER[0] ?? '');
  const [draft, setDraft] = useState<Record<string, string>>({});

  const value = draft[file] ?? read(file);

  return (
    <div className="pg">
      <div className="shell pg__head">
        <div>
          <h1>{page.title}</h1>
          <p>{page.lead}</p>
        </div>
        <span className="pg__meta">
          {packages > 0 && (
            <span>
              {packages} {page.packages}
            </span>
          )}
          <StatusPill phase={phase} durationMs={durationMs} labels={page.status} />
        </span>
      </div>

      <div className="shell pg__frame">
        <div className="pg__panes">
          <section className="pg__pane">
            <div className="pg__tabs" role="tablist">
              {FILE_ORDER.map((path) => (
                <button
                  key={path}
                  role="tab"
                  aria-selected={file === path}
                  data-on={file === path}
                  onClick={() => setFile(path)}
                >
                  {path.split('/').pop()}
                </button>
              ))}
            </div>

            <Editor
              value={value}
              onChange={(next) => {
                setDraft((previous) => ({ ...previous, [file]: next }));
                write(file, next);
              }}
            />
          </section>

          <section className="pg__pane pg__pane--preview">
            <div className="pg__bar">
              <span className="pg__dots">
                <i />
                <i />
                <i />
              </span>
              <span className="pg__label">{page.preview}</span>
            </div>

            {phase === 'installing' ? (
              <div className="pg__waiting">
                <span className="pg__spinner" />
                {page.status.installing}
              </div>
            ) : (
              <iframe className="pg__iframe" title={page.preview} srcDoc={html} />
            )}
          </section>
        </div>

        {errors.length > 0 && (
          <div className="pg__errors">
            {errors.map((error, index) => (
              <p key={index}>
                {error.file && (
                  <code>
                    {error.file.replace(/^[a-z-]+:/, '')}:{error.line ?? 0}
                  </code>
                )}
                {error.text}
              </p>
            ))}
          </div>
        )}

        <p className="pg__note">{page.note}</p>
      </div>
    </div>
  );
}
