import { useEffect, useState } from 'react';
import { CodeBlock } from '@/components/ui/code-block';
import { useCopy } from '@/i18n/use-copy';
import { DESIGN_URL } from '@/data/links';
import './docs.css';

export function Docs() {
  const { copy } = useCopy();
  const sections = copy.docs.sections;
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const onScroll = (): void => {
      const last = sections[sections.length - 1];
      const atBottom =
        window.scrollY + window.innerHeight >= document.body.scrollHeight - 8;

      // The last section is short and its top never crosses the trigger line, so the
      // bottom of the page counts as reaching it.
      if (atBottom && last) {
        setActive(last.id);

        return;
      }

      const passed = sections.filter((section) => {
        const node = document.getElementById(section.id);

        return node !== null && node.getBoundingClientRect().top <= 140;
      });

      setActive(passed[passed.length - 1]?.id ?? sections[0]?.id ?? '');
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [sections]);

  return (
    <div className="docs">
      <div className="shell docs__inner">
        <aside className="docs__aside">
          <nav>
            <h2>{copy.docs.onThisPage}</h2>
            <ul>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} data-on={active === section.id}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="docs__body">
          <header className="docs__head">
            <h1>{copy.docs.title}</h1>
            <p>{copy.docs.subtitle}</p>
          </header>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="docs__section">
              <h2>
                <a href={`#${section.id}`} aria-hidden="true">
                  #
                </a>
                {section.title}
              </h2>
              <p>{section.body}</p>

              {'code' in section && section.code && <CodeBlock code={section.code} />}

              {'table' in section && section.table && (
                <div className="docs__table">
                  {section.table.map((row) => (
                    <div key={row[0]}>
                      <code>{row[0]}</code>
                      <span>{row[1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          <a className="docs__more" href={DESIGN_URL}>
            {copy.docs.more}
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3.5 10.5 8 6 12.5" />
            </svg>
          </a>
        </article>
      </div>
    </div>
  );
}
