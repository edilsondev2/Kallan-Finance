import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { KallanGlyph } from "./logo";

const DOTS = [
  { x: "8%", s: 3, t: 16, d: 0, dx: 30 },
  { x: "18%", s: 5, t: 20, d: 4, dx: -20 },
  { x: "29%", s: 3, t: 14, d: 8, dx: 24 },
  { x: "41%", s: 4, t: 18, d: 2, dx: -30 },
  { x: "53%", s: 3, t: 22, d: 6, dx: 18 },
  { x: "64%", s: 5, t: 17, d: 10, dx: -26 },
  { x: "75%", s: 3, t: 15, d: 3, dx: 22 },
  { x: "86%", s: 4, t: 21, d: 7, dx: -18 },
  { x: "93%", s: 3, t: 19, d: 12, dx: 14 },
] as const;

/**
 * Animated backdrop for the sign-up flow (welcome, auth, onboarding, reset password).
 * Always dark (.k-dark) so it stays rich on any device theme. Pure CSS motion, plus a soft
 * light that follows the pointer. Reduced motion turns the animation off in kallan.css.
 */
export function AuthStage({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={ref} className={cn("k-stage k-dark", className)}>
      <div className="k-stage-bg" aria-hidden="true">
        <div className="k-orb o1" />
        <div className="k-orb o2" />
        <div className="k-orb o3" />
        <div className="k-stage-grid" />
        <div className="k-ring" />
        <div className="k-ring" style={{ "--d": "3.3s" } as React.CSSProperties} />
        <div className="k-ring" style={{ "--d": "6.6s" } as React.CSSProperties} />
        <KallanGlyph className="k-stage-glyph" />
        {DOTS.map((p, i) => (
          <span key={i} className="k-dot" style={{ "--x": p.x, "--s": `${p.s}px`, "--t": `${p.t}s`, "--d": `${p.d}s`, "--dx": `${p.dx}px` } as React.CSSProperties} />
        ))}
        <div className="k-stage-glow" />
        <div className="k-stage-vig" />
      </div>
      {children}
    </div>
  );
}
