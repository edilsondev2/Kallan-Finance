import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from its previous value (0 on first render) to `target`.
 * Skips the animation when disabled or when the device asks for reduced motion.
 */
export function useCountUp(target: number, enabled = true, duration = 1100): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  const from = useRef(enabled ? 0 : target);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enabled || reduce) {
      from.current = target;
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const current = origin + (target - origin) * eased;
      from.current = current;
      setValue(current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, duration]);

  return value;
}
