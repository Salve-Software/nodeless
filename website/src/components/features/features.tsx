import { RichText } from '@/components/ui/rich-text';
import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import './features.css';

export function Features() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section features" ref={ref} id="features">
      <div className="shell">
        <header className="features__head">
          <span className="eyebrow" data-reveal>
            {copy.features.eyebrow}
          </span>
          <h2 data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
            {copy.features.title}
          </h2>
        </header>

        <div className="features__grid">
          {copy.features.items.map((item, index) => (
            <article
              key={item.title}
              className="feature"
              data-reveal
              style={
                {
                  '--reveal-delay': `${String((index % 3) * 90)}ms`,
                } as React.CSSProperties
              }
            >
              <span className="feature__index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>
                <RichText text={item.body} />
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
