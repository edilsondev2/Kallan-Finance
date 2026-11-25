import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Standard page wrapper: consistent widths, spacing and entrance animation. */
export function Page({ children, className, wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn("mx-auto w-full px-4 pt-4 pb-safe-nav md:px-8 md:pt-8 md:pb-12", wide ? "max-w-7xl" : "max-w-5xl", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  backTo,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  backTo?: string;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 animate-rise">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="press mb-3 inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" /> Voltar
          </Link>
        )}
        {eyebrow && <p className="text-label text-primary-glow">{eyebrow}</p>}
        <h1 className="text-headline mt-1 md:text-[1.875rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionTitle({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-title">{title}</h2>
      {action}
    </div>
  );
}
