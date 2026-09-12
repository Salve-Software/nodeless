import { useEffect, useState } from 'react';

/** Counts to `target` once, on mount. Used for the build time in the hero. */
export function useCountUp(target: number, duration = 1400): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);

      return;
    }

    let frame = 0;
    const started = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
