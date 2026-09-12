import { useState } from 'react';
import { BuildCard } from './build-card';
import { RichText } from '@/components/ui/rich-text';
import { useCopy } from '@/i18n/use-copy';
import { DOCS_URL, PLAYGROUND_URL } from '@/data/links';
import './hero.css';

export function Hero() {
  const { copy } = useCopy();
  const [copied, setCopied] = useState(false);

  const onCopy = (): void => {
    void navigator.clipboard.writeText(copy.hero.install).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <section className="hero" id="top">
      <div className="hero__inner shell">
        <div className="hero__text">
          <a className="hero__badge" href={DOCS_URL}>
            <i />
            {copy.hero.badge}
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3.5 10.5 8 6 12.5" />
            </svg>
          </a>

          <h1 className="hero__title">
            <span>{copy.hero.title[0]}</span>
            <span className="gradient-text">{copy.hero.title[1]}</span>
          </h1>

          <p className="hero__lead">
            <RichText text={copy.hero.lead} />
          </p>

          <div className="hero__install">
            <code>
              <span className="hero__prompt">$</span> {copy.hero.install}
            </code>
            <button onClick={onCopy} aria-label={copy.hero.copy} data-copied={copied}>
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
            <a className="btn btn--primary" href={DOCS_URL}>
              {copy.hero.primary}
            </a>
            <a className="btn btn--ghost" href={PLAYGROUND_URL}>
              {copy.hero.secondary}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </a>
          </div>

          <dl className="hero__stats">
            {copy.hero.stats.map((stat) => (
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
  );
}
