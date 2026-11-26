import { useEffect, useState } from "react";

/** Reveals `total` characters over time (about 2 seconds at most). Instant when disabled or on reduced motion. */
export function useTypewriter(total: number, enabled: boolean): number {
  const [n, setN] = useState(enabled ? 0 : total);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enabled || reduce || total === 0) {
      setN(total);
      return undefined;
    }
    const perChar = Math.max(8, Math.min(24, 2200 / total));
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const next = Math.min(total, Math.floor((now - start) / perChar));
      setN(next);
      if (next < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total, enabled]);

  return n;
}
