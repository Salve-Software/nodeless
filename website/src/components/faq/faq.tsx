import { useState } from 'react';
import { RichText } from '@/components/ui/rich-text';
import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import './faq.css';

export function Faq() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section faq" ref={ref} id="faq">
      <div className="shell faq__inner">
        <header className="faq__head">
          <span className="eyebrow" data-reveal>
            {copy.faq.eyebrow}
          </span>
          <h2 data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
            {copy.faq.title}
          </h2>
        </header>

        <div className="faq__list">
          {copy.faq.items.map((item, index) => (
            <article
              key={item.q}
              className="faq__item"
              data-open={open === index}
              data-reveal
              style={
                { '--reveal-delay': `${String(index * 60)}ms` } as React.CSSProperties
              }
            >
              <button
                onClick={() => setOpen(open === index ? null : index)}
                aria-expanded={open === index}
              >
                <span>{item.q}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M10 4.5v11M4.5 10h11" />
                </svg>
              </button>
              <div className="faq__answer">
                <p>
                  <RichText text={item.a} />
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
