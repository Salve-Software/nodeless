import { RichText } from '@/components/ui/rich-text';
import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import './isolation.css';

const OPEN = new Set(['reached', 'conseguiu']);

export function Isolation() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section isolation" ref={ref} id="isolation">
      <div className="shell isolation__inner">
        <header className="isolation__head">
          <span className="eyebrow" data-reveal>
            {copy.isolation.eyebrow}
          </span>
          <h2 data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
            {copy.isolation.title}
          </h2>
          <p
            className="lead"
            data-reveal
            style={{ '--reveal-delay': '120ms' } as React.CSSProperties}
          >
            <RichText text={copy.isolation.lead} />
          </p>
          <p
            className="isolation__note"
            data-reveal
            style={{ '--reveal-delay': '180ms' } as React.CSSProperties}
          >
            <RichText text={copy.isolation.note} />
          </p>
        </header>

        <div className="isolation__table" data-reveal>
          <div className="isolation__row isolation__row--head">
            <span>{copy.isolation.columns.probe}</span>
            <span>{copy.isolation.columns.none}</span>
            <span>{copy.isolation.columns.worker}</span>
          </div>

          {copy.isolation.probes.map((probe, index) => (
            <div
              key={probe.probe}
              className="isolation__row"
              data-reveal
              style={
                { '--reveal-delay': `${String(index * 70)}ms` } as React.CSSProperties
              }
            >
              <span className="isolation__probe">{probe.probe}</span>
              <span
                className="isolation__cell"
                data-open={OPEN.has(probe.none) || /\d|hunter/.test(probe.none)}
              >
                {probe.none}
              </span>
              <span className="isolation__cell isolation__cell--safe">
                {probe.worker}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
