import { useEffect, useState } from 'react';
import { Brand } from '@/components/brand/brand';
import { Link } from '@/router/link';
import { useCopy } from '@/i18n/use-copy';
import { useTheme } from '@/hooks/use-theme';
import { NPM_URL, REPO_URL } from '@/data/links';
import type { Route } from '@/router/use-route';
import './nav.css';

export function Nav({ route, go }: { route: Route; go: (to: Route) => void }) {
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
        <Link to="/" go={go} className="nav__brand">
          <Brand />
        </Link>

        <nav className="nav__links">
          <Link to="/" go={go}>
            <span data-on={route === '/'}>{copy.nav.home}</span>
          </Link>
          <Link to="/docs" go={go}>
            <span data-on={route === '/docs'}>{copy.nav.docs}</span>
          </Link>
          <Link to="/playground" go={go}>
            <span data-on={route === '/playground'}>{copy.nav.playground}</span>
          </Link>
          <a href={REPO_URL}>
            <span>{copy.nav.github}</span>
          </a>
          <a href={NPM_URL}>
            <span>{copy.nav.npm}</span>
          </a>
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
