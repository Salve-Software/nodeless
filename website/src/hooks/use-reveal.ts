import { useEffect, useRef } from 'react';

/** Adds `data-shown` the first time the element scrolls into view, then stops watching. */
export function useReveal<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const targets = [node, ...node.querySelectorAll<HTMLElement>('[data-reveal]')];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset['shown'] = 'true';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    for (const target of targets) {
      if (target.hasAttribute('data-reveal')) observer.observe(target);
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}
