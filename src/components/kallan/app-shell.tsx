import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeftRight, Bell, Landmark, Settings, Target, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/modules/auth/auth-context";
import { useMyProfile } from "@/modules/settings/queries";
import { cn } from "@/lib/utils";
import { KallanLogo } from "./logo";
import { PRIMARY_NAV } from "./nav-config";
import { UserAvatar } from "./user-avatar";

const SHORTCUTS = [
  { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/carteira", label: "Carteira", icon: Wallet },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/open-finance", label: "Open Finance", icon: Landmark },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

function isActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(to + "/");
}

export function useUnreadCount() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["notifications-unread", userId],
    enabled: !!userId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      return count ?? 0;
    },
  });
}

export function NotificationBell({ className }: { className?: string }) {
  const { data: unread = 0 } = useUnreadCount();
  return (
    <Link
      to="/notificacoes"
      aria-label={unread ? `Notificações, ${unread} não lidas` : "Notificações"}
      className={cn("press relative inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface hover:bg-surface-2", className)}
    >
      <Bell className="size-[18px]" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

function DesktopSidebar() {
  const { pathname } = useLocation();
  const { data: profile } = useMyProfile();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
      <Link to="/inicio" className="px-2">
        <KallanLogo />
      </Link>
      <nav className="mt-8 space-y-1" aria-label="Principal">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "press group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />}
              <item.icon className={cn("size-[18px]", active && "text-primary-glow")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="text-label mt-8 px-3 text-muted-foreground">Atalhos</p>
      <nav className="mt-2 space-y-0.5" aria-label="Atalhos">
        {SHORTCUTS.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "press flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] transition-colors",
                active ? "text-foreground bg-surface-2" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-4", active && "text-primary-glow")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link to="/perfil" className="press mt-auto flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 hover:bg-surface-2">
        <UserAvatar name={profile?.display_name} path={profile?.avatar_url} className="size-9" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{profile?.display_name || "Seu perfil"}</span>
          <span className="block text-xs text-muted-foreground">Plano gratuito</span>
        </span>
      </Link>
    </aside>
  );
}

function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Principal"
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] shadow-float lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className="press relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              {active && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-primary" />}
              <item.icon className={cn("size-[22px] transition-colors", active ? "text-primary-glow" : "text-muted-foreground")} strokeWidth={active ? 2.4 : 1.9} />
              <span className={cn("text-xs font-medium transition-colors", active ? "text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <DesktopSidebar />
      <main className="min-w-0 flex-1">
        <div key={useLocation().pathname} className="animate-fade">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
