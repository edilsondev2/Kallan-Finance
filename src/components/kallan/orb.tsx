import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { KallanGlyph } from "./logo";

export type OrbState = "idle" | "thinking" | "speaking";

/** The living Kallan Intelligence orb. Pure CSS; the state changes how fast and how strongly it moves. */
export function KallanOrb({ state = "idle", size = 96, className, glyph = false }: { state?: OrbState; size?: number; className?: string; glyph?: boolean }) {
  return (
    <span className={cn("k-ai-orb", glyph && "bare", className)} data-state={state} style={{ "--s": `${size}px` } as CSSProperties} aria-hidden="true">
      <i className="halo" />
      <i className="core" />
      <i className="swirl" />
      <i className="swirl two" />
      <i className="shine" />
      {glyph && <KallanGlyph className="glyph" />}
    </span>
  );
}
