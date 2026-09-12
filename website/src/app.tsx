import { Backdrop } from '@/components/backdrop/backdrop';
import { Footer } from '@/components/footer/footer';
import { Nav } from '@/components/nav/nav';
import { Docs } from '@/pages/docs/docs';
import { Home } from '@/pages/home/home';
import { useRoute } from '@/router/use-route';

export function App() {
  const { route, go } = useRoute();

  return (
    <>
      <Backdrop />
      <Nav route={route} go={go} />
      <main className="page">{route === '/docs' ? <Docs /> : <Home go={go} />}</main>
      <Footer />
    </>
  );
}
