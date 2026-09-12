import { BuildCard } from './build-card';
import { CodeBlock } from '@/components/ui/code-block';
import { Link } from '@/router/link';
import { useCopy } from '@/i18n/use-copy';
import { useReveal } from '@/hooks/use-reveal';
import { REPO_URL, PLAYGROUND_URL } from '@/data/links';
import type { Route } from '@/router/use-route';
import { useState } from 'react';
import './home.css';

export function Home({ go }: { go: (to: Route) => void }) {
  const { copy } = useCopy();
  const home = copy.home;
  const ref = useReveal<HTMLDivElement>();
  const [copied, setCopied] = useState(false);

  const onCopy = (): void => {
    void navigator.clipboard.writeText(home.install).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div ref={ref}>
      <section className="hero">
        <div className="shell hero__inner">
          <div className="hero__text">
            <span className="hero__badge">
              <i />
              {home.badge}
            </span>

            <h1 className="hero__title">{home.title}</h1>
            <p className="hero__lead">{home.lead}</p>

            <div className="hero__install">
              <code>
                <span className="hero__prompt">$</span> {home.install}
              </code>
              <button onClick={onCopy} aria-label={home.copy} data-copied={copied}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  {copied ? (
                    <path d="M4.5 10.5 8 14l7.5-8" />
                  ) : (
                    <>
                      <rect x="7" y="7" width="9" height="9" rx="2" />
                      <path d="M13 4.5H5.8A1.8 1.8 0 0 0 4 6.3V13" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            <div className="hero__actions">
              <Link to="/docs" go={go} className="btn btn--primary">
                {home.primary}
              </Link>
              <a className="btn btn--ghost" href={REPO_URL}>
                {home.secondary}
              </a>
            </div>

            <dl className="hero__stats">
              {home.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>
                    {stat.value}
                    <small>{stat.unit}</small>
                  </dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="hero__visual">
            <BuildCard />
          </div>
        </div>
      </section>

      <section className="section cards">
        <div className="shell cards__grid">
          {home.cards.map((card, index) => (
            <article
              key={card.title}
              data-reveal
              style={
                { '--reveal-delay': `${String(index * 70)}ms` } as React.CSSProperties
              }
            >
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section why">
        <div className="shell why__inner">
          <header className="why__head" data-reveal>
            <span className="eyebrow">{home.why.eyebrow}</span>
            <h2>{home.why.title}</h2>
            <p>{home.why.body}</p>
            <a className="why__link" href={`${REPO_URL}/tree/main/docs/design`}>
              {home.why.link}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </a>
          </header>

          <div className="why__split">
            {[
              { ...home.why.toolchain, tone: 'runs' },
              { ...home.why.app, tone: 'read' },
            ].map((column, index) => (
              <article
                key={column.title}
                className="why__card"
                data-tone={column.tone}
                data-reveal
                style={
                  { '--reveal-delay': `${String(index * 120)}ms` } as React.CSSProperties
                }
              >
                <h3>{column.title}</h3>
                <span className="why__verdict">{column.verdict}</span>
                <ul>
                  {column.files.map((file) => (
                    <li key={file}>
                      <i />
                      <code>{file}</code>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <p className="why__note" data-reveal>
            {home.why.note}
          </p>
        </div>
      </section>

      <section className="section sample">
        <div className="shell sample__inner">
          <header data-reveal>
            <span className="eyebrow">{home.sample.eyebrow}</span>
            <h2>{home.sample.title}</h2>
          </header>
          <div data-reveal style={{ '--reveal-delay': '90ms' } as React.CSSProperties}>
            <CodeBlock code={home.sample.code} file={home.sample.file} />
          </div>
        </div>
      </section>

      <section className="section closing">
        <div className="shell">
          <div className="closing__panel" data-reveal>
            <span className="closing__orb" aria-hidden="true" />
            <h2>{home.cta.title}</h2>
            <p>{home.cta.body}</p>
            <div className="closing__actions">
              <a className="btn btn--primary" href={PLAYGROUND_URL}>
                {home.cta.primary}
              </a>
              <Link to="/docs" go={go} className="btn btn--ghost">
                {home.cta.secondary}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
