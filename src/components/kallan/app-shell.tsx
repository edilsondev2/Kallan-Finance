import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/modules/auth/auth-context";
import { cn } from "@/lib/utils";
import { KallanGlyph } from "./logo";
import { KallanChatProvider, useKallanChat } from "./kallan-chat";
import { MORE_NAV, PRIMARY_NAV } from "./nav-config";

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

/** Desktop side menu: main areas, a few more, and the Kallan Intelligence card. */
function Rail() {
  const { pathname } = useLocation();
  const { openChat } = useKallanChat();
  return (
    <aside className="k-rail" aria-label="Menu lateral">
      <Link to="/inicio" className="k-brand" aria-label="Kallan Finance, início">
        <span className="k-brand-mark">
          <KallanGlyph />
        </span>
        <span>
          <b>Kallan</b>
          <small>Finance</small>
        </span>
      </Link>
      <nav className="k-rail-nav" aria-label="Principal">
        {PRIMARY_NAV.map((item) => (
          <Link key={item.to} to={item.to} className="k-rail-link" aria-current={isActive(pathname, item.to) ? "page" : undefined}>
            <item.icon />
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="k-rail-sub">Mais</p>
      <nav className="k-rail-nav" aria-label="Mais áreas">
        {MORE_NAV.map((item) => (
          <Link key={item.to} to={item.to} className="k-rail-link" aria-current={isActive(pathname, item.to) ? "page" : undefined}>
            <item.icon />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="k-rail-sp" />
      <div className="k-rail-ai">
        <b>Uma dúvida sobre seu dinheiro?</b>
        <p>A Kallan responde com os números das suas contas.</p>
        <button type="button" onClick={() => openChat()}>
          Conversar agora
        </button>
      </div>
    </aside>
  );
}

/** Mobile tab bar: four areas around the Kallan button. Slides away while scrolling down. */
function TabBar() {
  const { pathname } = useLocation();
  const { openChat } = useKallanChat();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last;
      if (y < 40 || dy < -6) setHidden(false);
      else if (dy > 10) setHidden(true);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [home, wallet, statement, goals] = PRIMARY_NAV;
  const left = [home, wallet];
  const right = [statement, goals];

  const tab = (item: (typeof PRIMARY_NAV)[number] | undefined) =>
    item ? (
      <Link key={item.to} to={item.to} className="k-tab" aria-current={isActive(pathname, item.to) ? "page" : undefined}>
        <item.icon />
        <span>{item.label}</span>
      </Link>
    ) : null;

  return (
    <nav className={cn("k-tabbar", hidden && "k-hide")} aria-label="Navegação móvel">
      <div className="k-tabbar-in">
        {left.map(tab)}
        <button type="button" className="k-tab-ai" onClick={() => openChat()} aria-label="Conversar com a Kallan">
          <Sparkles />
        </button>
        {right.map(tab)}
      </div>
    </nav>
  );
}

/** One-time opening animation per browser session. Respects reduced motion. */
function Intro() {
  const [phase, setPhase] = useState<"off" | "on" | "out">("off");

  useEffect(() => {
    try {
      if (sessionStorage.getItem("kf-intro")) return undefined;
      sessionStorage.setItem("kf-intro", "1");
    } catch {
      return undefined;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    setPhase("on");
    const t = window.setTimeout(() => setPhase("out"), 2600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "out") return undefined;
    const t = window.setTimeout(() => setPhase("off"), 600);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "off") return null;
  return (
    <div className={cn("k-intro", phase === "out" && "out")} aria-hidden="true" onClick={() => setPhase("out")}>
      <div className="k-px" />
      <span className="k-mark big">
        <KallanGlyph animated />
      </span>
      <div className="k-intro-name">KALLAN</div>
      <div className="k-intro-sub">Seu dinheiro, em um só lugar</div>
      <div className="k-intro-hint">Toque para entrar</div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <KallanChatProvider>
      <div className="k-aurora" aria-hidden="true" />
      <div className="k-shell">
        <Rail />
        <main className="k-main">
          <div key={pathname} className="k-page">
            {children}
          </div>
        </main>
      </div>
      <TabBar />
      <Intro />
    </KallanChatProvider>
  );
}
