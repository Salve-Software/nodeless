import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import { DESIGN_URL, PLAYGROUND_URL } from '@/data/links';
import './cta.css';

export function Cta() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section cta" ref={ref}>
      <div className="shell">
        <div className="cta__panel" data-reveal>
          <span className="cta__orb" aria-hidden="true" />
          <h2>{copy.cta.title}</h2>
          <p>{copy.cta.lead}</p>
          <div className="cta__actions">
            <a className="btn btn--primary" href={PLAYGROUND_URL}>
              {copy.cta.primary}
            </a>
            <a className="btn btn--ghost" href={DESIGN_URL}>
              {copy.cta.secondary}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
