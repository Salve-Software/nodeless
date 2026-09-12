import { lazy, Suspense } from 'react';
import { Backdrop } from '@/components/backdrop/backdrop';
import { Footer } from '@/components/footer/footer';
import { Nav } from '@/components/nav/nav';
import { Docs } from '@/pages/docs/docs';
import { Home } from '@/pages/home/home';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useRoute } from '@/router/use-route';

// The playground pulls the library in, so it is only fetched by whoever opens it.
const Playground = lazy(async () =>
  import('@/pages/playground/playground').then((module) => ({
    default: module.Playground,
  })),
);

export function App() {
  const { route, go } = useRoute();

  useDocumentTitle(route);

  return (
    <>
      <Backdrop />
      <Nav route={route} go={go} />
      <main className="page">
        {route === '/docs' && <Docs />}
        {route === '/playground' && (
          <Suspense fallback={<div className="page__loading" />}>
            <Playground />
          </Suspense>
        )}
        {route === '/' && <Home go={go} />}
      </main>
      <Footer />
    </>
  );
}
