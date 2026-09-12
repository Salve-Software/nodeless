import { Backdrop } from '@/components/backdrop/backdrop';
import { CodeSection } from '@/components/code/code-section';
import { Compare } from '@/components/compare/compare';
import { Cta } from '@/components/cta/cta';
import { Faq } from '@/components/faq/faq';
import { Features } from '@/components/features/features';
import { Footer } from '@/components/footer/footer';
import { Graphs } from '@/components/graphs/graphs';
import { Hero } from '@/components/hero/hero';
import { Insight } from '@/components/insight/insight';
import { Isolation } from '@/components/isolation/isolation';
import { Nav } from '@/components/nav/nav';

export function App() {
  return (
    <>
      <Backdrop />
      <Nav />
      <main className="page">
        <Hero />
        <Insight />
        <Graphs />
        <CodeSection />
        <Features />
        <Isolation />
        <Compare />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
