import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import './insight.css';

export function Insight() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section insight" ref={ref} id="idea">
      <div className="shell insight__inner">
        <header className="insight__head">
          <span className="eyebrow" data-reveal>
            {copy.insight.eyebrow}
          </span>
          <h2
            className="insight__title"
            data-reveal
            style={{ '--reveal-delay': '60ms' } as React.CSSProperties}
          >
            {copy.insight.title}
          </h2>
          <p
            className="lead"
            data-reveal
            style={{ '--reveal-delay': '120ms' } as React.CSSProperties}
          >
            {copy.insight.lead}
          </p>
        </header>

        <ul className="insight__rows">
          {copy.insight.rows.map((row, index) => (
            <li
              key={row.job}
              data-reveal
              style={
                { '--reveal-delay': `${String(index * 110)}ms` } as React.CSSProperties
              }
            >
              <span className="insight__job">{row.job}</span>
              <span className="insight__verdict">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M6 10.5 8.8 13.2 14.4 7" />
                </svg>
                {row.vm}
              </span>
              <span className="insight__note">{row.note}</span>
            </li>
          ))}
        </ul>
        <span className="insight__legend">{copy.insight.vmLabel}</span>
      </div>
    </section>
  );
}
