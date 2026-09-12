import { useState } from 'react';
import { CodeBlock } from '@/components/ui/code-block';
import { RichText } from '@/components/ui/rich-text';
import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import './code-section.css';

export function CodeSection() {
  const { copy } = useCopy();
  const ref = useReveal<HTMLElement>();
  const [active, setActive] = useState(0);
  const tab = copy.code.tabs[active] ?? copy.code.tabs[0];

  if (!tab) return null;

  return (
    <section className="section code-section" ref={ref} id="usage">
      <div className="shell">
        <header className="code-section__head">
          <span className="eyebrow" data-reveal>
            {copy.code.eyebrow}
          </span>
          <h2 data-reveal style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
            {copy.code.title}
          </h2>
          <p
            className="lead"
            data-reveal
            style={{ '--reveal-delay': '120ms' } as React.CSSProperties}
          >
            {copy.code.lead}
          </p>
        </header>

        <div className="code-section__panel" data-reveal>
          <div className="code-section__tabs" role="tablist">
            {copy.code.tabs.map((entry, index) => (
              <button
                key={entry.id}
                role="tab"
                aria-selected={index === active}
                data-on={index === active}
                onClick={() => setActive(index)}
              >
                {entry.label}
              </button>
            ))}
            <span
              className="code-section__ink"
              style={
                {
                  '--count': copy.code.tabs.length,
                  '--index': active,
                } as React.CSSProperties
              }
            />
          </div>

          <div className="code-section__body" key={tab.id}>
            <CodeBlock code={tab.code} file={tab.file} />
            <p className="code-section__note">
              <RichText text={tab.note} />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
