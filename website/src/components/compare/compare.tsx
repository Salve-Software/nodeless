import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import './compare.css';

export function Compare() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section compare" ref={ref}>
      <div className="shell">
        <header className="compare__head">
          <span className="eyebrow" data-reveal>
            {copy.compare.eyebrow}
          </span>
          <h2 data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
            {copy.compare.title}
          </h2>
        </header>

        <div className="compare__grid">
          {copy.compare.items.map((item, index) => (
            <article
              key={item.title}
              className="compare__card"
              data-tone={item.tone}
              data-reveal
              style={
                { '--reveal-delay': `${String(index * 110)}ms` } as React.CSSProperties
              }
            >
              <span className="compare__verdict">{item.verdict}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
