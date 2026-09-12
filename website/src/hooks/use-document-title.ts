import { useEffect } from 'react';
import type { Route } from '@/router/use-route';

const TITLES: Record<Route, string> = {
  '/': 'nodeless',
  '/docs': 'Docs · nodeless',
  '/playground': 'Playground · nodeless',
};

export function useDocumentTitle(route: Route): void {
  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);
}
