import { useCallback, useEffect, useState } from 'react';

export type Route = '/' | '/docs' | '/playground';

function current(): Route {
  const path = window.location.pathname.replace(import.meta.env.BASE_URL, '/');

  if (path.startsWith('/docs')) return '/docs';
  if (path.startsWith('/playground')) return '/playground';

  return '/';
}

/** Path routing, with a 404.html copy so a deep link works on GitHub Pages. */
export function useRoute(): { route: Route; go: (to: Route) => void } {
  const [route, setRoute] = useState<Route>(current);

  useEffect(() => {
    const onPop = (): void => setRoute(current());

    window.addEventListener('popstate', onPop);

    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((to: Route) => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');

    window.history.pushState(null, '', `${base}${to}`);
    setRoute(to);
    window.scrollTo(0, 0);
  }, []);

  return { route, go };
}
