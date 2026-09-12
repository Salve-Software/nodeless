import { useEffect, useState } from 'react';
import { useCountUp } from '@/hooks/use-count-up';
import type { Phase } from './use-playground';
import './status-pill.css';

interface Slot {
  key: number;
  phase: Phase;
  ms: number;
}

/** Counts up, so a rebuild that lands on the same number still reads as something happening. */
function Duration({ ms }: { ms: number }) {
  return <>{useCountUp(ms, 420)} ms</>;
}

/**
 * The phase changes before the pill does: the old label leaves while the new one arrives, and
 * the pill's width is the sum of the two, which is what makes it settle instead of jump.
 */
export function StatusPill({
  phase,
  durationMs,
  labels,
}: {
  phase: Phase;
  durationMs: number;
  labels: { installing: string; building: string; failed: string };
}) {
  const [slots, setSlots] = useState<{ current: Slot; leaving: Slot | null }>(() => ({
    current: { key: 0, phase, ms: durationMs },
    leaving: null,
  }));

  useEffect(() => {
    setSlots((previous) => {
      const { current } = previous;

      if (current.phase === phase) {
        return current.ms === durationMs
          ? previous
          : { ...previous, current: { ...current, ms: durationMs } };
      }

      return {
        current: { key: current.key + 1, phase, ms: durationMs },
        leaving: current,
      };
    });
  }, [phase, durationMs]);

  const label = (slot: Slot) =>
    slot.phase === 'ready' ? <Duration ms={slot.ms} /> : labels[slot.phase];

  return (
    <span className="pill" data-phase={phase}>
      <i className="pill__dot" />

      <span className="pill__swap">
        {slots.leaving && (
          <span
            key={slots.leaving.key}
            className="pill__slot"
            data-dir="out"
            onAnimationEnd={() =>
              setSlots((previous) => ({ ...previous, leaving: null }))
            }
          >
            <span>{label(slots.leaving)}</span>
          </span>
        )}

        <span key={slots.current.key} className="pill__slot" data-dir="in">
          <span>{label(slots.current)}</span>
        </span>
      </span>
    </span>
  );
}
