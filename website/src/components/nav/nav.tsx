import { useEffect, useState } from 'react';
import { Brand } from '@/components/brand/brand';
import { useCopy } from '@/i18n/use-copy';
import { useTheme } from '@/hooks/use-theme';
import { REPO_URL, NPM_URL, DOCS_URL } from '@/data/links';
import './nav.css';

export function Nav() {
  const { copy, lang, setLang } = useCopy();
  const { theme, toggle } = useTheme();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setStuck(window.scrollY > 12);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="nav" data-stuck={stuck}>
      <div className="nav__inner shell">
        <a className="nav__brand" href="#top">
          <Brand />
        </a>

        <nav className="nav__links">
          <a href={DOCS_URL}>{copy.nav.docs}</a>
          <a href={REPO_URL}>{copy.nav.github}</a>
          <a href={NPM_URL}>{copy.nav.npm}</a>
        </nav>

        <div className="nav__tools">
          <div className="nav__lang" role="group" aria-label={copy.nav.language}>
            <button data-on={lang === 'en'} onClick={() => setLang('en')}>
              EN
            </button>
            <button data-on={lang === 'pt-BR'} onClick={() => setLang('pt-BR')}>
              PT
            </button>
          </div>

          <button className="nav__theme" onClick={toggle} aria-label={copy.nav.theme}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {theme === 'dark' ? (
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
