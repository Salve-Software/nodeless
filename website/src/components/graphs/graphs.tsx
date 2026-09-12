import { RichText } from '@/components/ui/rich-text';
import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import './graphs.css';

export function Graphs() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();

  const columns = [
    { ...copy.graphs.toolchain, tone: 'runs' as const, icon: 'run' as const },
    { ...copy.graphs.app, tone: 'read' as const, icon: 'read' as const },
  ];

  return (
    <section className="section graphs" ref={ref} id="how">
      <div className="shell">
        <header className="graphs__head">
          <span className="eyebrow" data-reveal>
            {copy.graphs.eyebrow}
          </span>
          <h2
            className="graphs__title"
            data-reveal
            style={{ '--reveal-delay': '60ms' } as React.CSSProperties}
          >
            {copy.graphs.title}
          </h2>
          <p
            className="lead graphs__lead"
            data-reveal
            style={{ '--reveal-delay': '120ms' } as React.CSSProperties}
          >
            {copy.graphs.lead}
          </p>
        </header>

        <div className="graphs__split">
          {columns.map((column, side) => (
            <article
              key={column.title}
              className="graph"
              data-tone={column.tone}
              data-reveal
              style={
                { '--reveal-delay': `${String(side * 160)}ms` } as React.CSSProperties
              }
            >
              <span className="graph__sweep" aria-hidden="true" />

              <header className="graph__head">
                <span className="graph__icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    {column.icon === 'run' ? (
                      <path d="M7 5.2 15 10l-8 4.8z" />
                    ) : (
                      <>
                        <path d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10z" />
                        <circle cx="10" cy="10" r="2.4" />
                      </>
                    )}
                  </svg>
                </span>
                <h3>{column.title}</h3>
                <span className="graph__verdict">{column.verdict}</span>
              </header>

              <ul className="graph__files">
                {column.files.map((file, index) => (
                  <li key={file} style={{ '--i': index } as React.CSSProperties}>
                    <i />
                    <code>{file}</code>
                  </li>
                ))}
              </ul>

              <p className="graph__note">{column.note}</p>
            </article>
          ))}

          <span className="graphs__seam" aria-hidden="true" />
        </div>

        <p className="graphs__foot" data-reveal>
          <RichText text={copy.graphs.footnote} />
        </p>
      </div>
    </section>
  );
}
