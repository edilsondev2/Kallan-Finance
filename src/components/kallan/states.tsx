import type { ReactNode } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card relative overflow-hidden px-6 py-10 text-center animate-rise", className)}>
      <div className="relative mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/12 text-primary-glow">
        <Icon className="size-6" />
      </div>
      <h3 className="text-title relative mt-4">{title}</h3>
      {description && <p className="relative mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="relative mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Algo não carregou",
  description = "Verifique sua conexão e tente novamente.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex flex-col items-center px-6 py-8 text-center", className)} role="alert">
      <div className="flex size-12 items-center justify-center rounded-xl bg-negative/12 text-negative">
        <AlertTriangle className="size-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw /> Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

export function LoadingCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface-card space-y-3 p-5">
          <SkeletonBlock className="h-3 w-1/3" />
          <SkeletonBlock className="h-6 w-2/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
