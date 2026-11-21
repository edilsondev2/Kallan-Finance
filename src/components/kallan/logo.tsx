import { cn } from "@/lib/utils";

export function KallanMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <defs>
        <linearGradient id="kallan-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary-glow)" />
          <stop offset="100%" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <path d="M10 8v16" stroke="url(#kallan-g)" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M22.5 8.5 13.5 16l9 7.5" fill="none" stroke="url(#kallan-g)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KallanLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <KallanMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-semibold tracking-[0.22em]">KALLAN</span>
          <span className="mt-0.5 text-[9px] font-medium tracking-[0.42em] text-primary">FINANCE</span>
        </span>
      )}
    </span>
  );
}
