import { cn } from "@/lib/utils";

/** The Kallan glyph: a K with a small spark. Draws in currentColor; the spark takes the brand violet. */
export function KallanGlyph({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={animated ? 2.6 : 3} strokeLinecap="round" strokeLinejoin="round">
      <path className={animated ? "d d1" : undefined} pathLength={1} d="M28 18v60" />
      <path className={animated ? "d d2" : undefined} pathLength={1} d="M28 50 60 20" />
      <path className={animated ? "d d3" : undefined} pathLength={1} d="M38 41 64 78" />
      <path className="sp" d="M72 14l2.2 6.3L80.5 22.5l-6.3 2.2L72 31l-2.2-6.3L63.5 22.5l6.3-2.2z" strokeWidth={1.6} />
    </svg>
  );
}

/** Square app mark (used on 404, auth and the sidebar). */
export function KallanMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid size-8 shrink-0 place-items-center rounded-[10px] bg-foreground text-background [&_.sp]:fill-brand [&_.sp]:stroke-brand", className)}
    >
      <KallanGlyph className="size-[78%]" />
    </span>
  );
}

export function KallanLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KallanMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-[0.22em]">KALLAN</span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-[0.42em] text-muted-foreground">FINANCE</span>
        </span>
      )}
    </span>
  );
}
