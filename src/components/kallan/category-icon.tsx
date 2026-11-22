import {
  Briefcase, Car, Circle, GraduationCap, Handshake, HeartPulse, Home, Laptop, Megaphone, Monitor, Package,
  PartyPopper, PlusCircle, Receipt, Repeat, ShoppingBag, ShoppingCart, Store, TrendingUp, Users, Utensils, Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, home: Home, car: Car, "shopping-bag": ShoppingBag, "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse, "party-popper": PartyPopper, wrench: Wrench, repeat: Repeat, circle: Circle,
  briefcase: Briefcase, laptop: Laptop, "trending-up": TrendingUp, "plus-circle": PlusCircle,
  "shopping-cart": ShoppingCart, handshake: Handshake, package: Package, megaphone: Megaphone, store: Store,
  receipt: Receipt, monitor: Monitor, users: Users,
};

/** Category color name -> chart token. Keeps categories on the design-system palette. */
const CATEGORY_COLOR: Record<string, string> = {
  emerald: "var(--chart-1)", green: "var(--chart-1)", lime: "var(--chart-1)",
  amber: "var(--chart-2)", orange: "var(--chart-6)",
  sky: "var(--chart-3)", indigo: "var(--chart-3)", cyan: "var(--chart-7)", teal: "var(--chart-7)",
  pink: "var(--chart-4)", rose: "var(--chart-4)",
  violet: "var(--chart-5)",
  slate: "var(--chart-8)",
};

export function categoryColor(name: string | null | undefined): string {
  return CATEGORY_COLOR[name ?? "slate"] ?? "var(--chart-8)";
}

export function CategoryIcon({ icon, color, className }: { icon?: string | null; color?: string | null; className?: string }) {
  const Icon = ICONS[icon ?? "circle"] ?? Circle;
  const c = categoryColor(color);
  return (
    <span
      className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border", className)}
      style={{ color: c, background: `color-mix(in oklab, ${c} 14%, transparent)` }}
    >
      <Icon className="size-[18px]" />
    </span>
  );
}
