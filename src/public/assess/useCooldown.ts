import { useCallback, useEffect, useRef, useState } from 'react';

/** A one-second countdown (resend cooldown). `start(30)` → `remaining` ticks 30 … 0. */
export function useCooldown(): { remaining: number; start: (seconds: number) => void; active: boolean } {
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    if (timer.current !== undefined) {
      window.clearInterval(timer.current);
      timer.current = undefined;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      stop();
      const total = Math.max(0, Math.ceil(seconds));
      setRemaining(total);
      if (total === 0) return;
      timer.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            stop();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { remaining, start, active: remaining > 0 };
}
