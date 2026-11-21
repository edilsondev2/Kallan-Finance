import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, tone = "primary" }: { value: number; className?: string; tone?: "primary" | "warning" | "negative" }) {
  const pct = Math.max(0, Math.min(1, value));
  const bar = tone === "warning" ? "bg-warning" : tone === "negative" ? "bg-negative" : "bg-emerald-gradient";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3/70", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <div className={cn("h-full origin-left rounded-full animate-bar", bar)} style={{ width: `${pct * 100}%` }} />
    </div>
  );
}
