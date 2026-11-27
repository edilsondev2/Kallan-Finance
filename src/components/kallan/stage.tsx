import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Backdrop for the sign-up flow (welcome, auth, onboarding, reset password).
 * Always dark (.k-dark). A single soft violet light from above, fine chart-like lines that draw in once
 * and then drift, film grain and a vignette. No floating blobs. Reduced motion turns the animation off in kallan.css.
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
        <div className="k-bgl-aurora" />
        <svg className="k-bgl-lines" viewBox="0 0 1440 560" preserveAspectRatio="none" focusable="false">
          <defs>
            <linearGradient id="k-bgl-g" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="rgba(165,129,247,0)" />
              <stop offset="0.45" stopColor="rgba(190,165,255,0.85)" />
              <stop offset="1" stopColor="rgba(165,129,247,0)" />
            </linearGradient>
          </defs>
          <path className="l2" d="M0 420 C 220 380, 340 470, 560 400 S 980 300, 1180 340 S 1380 300, 1440 280" />
          <path className="l3" d="M0 490 C 260 440, 420 520, 700 450 S 1100 380, 1440 400" />
          <path className="l1" d="M0 360 C 180 330, 300 400, 520 340 S 900 200, 1120 250 S 1360 190, 1440 150" />
        </svg>
        <div className="k-bgl-grain" />
        <div className="k-stage-glow" />
        <div className="k-stage-vig" />
      </div>
      {children}
    </div>
  );
}
