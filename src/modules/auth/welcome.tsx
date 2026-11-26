import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LogOut, ShieldCheck, Sparkles, Target, Wallet, ChartNoAxesCombined } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KallanLogo } from "@/components/kallan/logo";
import { AuthStage } from "@/components/kallan/stage";
import { useAuth, signOutEverywhere } from "./auth-context";

const FEATURES = [
  { icon: Wallet, title: "Seu dinheiro, por inteiro", text: "Contas, gastos e investimentos em uma visão organizada." },
  { icon: Target, title: "Objetivos que ganham forma", text: "Acompanhe cada passo em direção aos seus planos." },
  { icon: ChartNoAxesCombined, title: "Decisões com mais clareza", text: "Entenda seus números e encontre o seu próximo passo." },
] as const;

const delay = (n: number) => ({ "--n": n }) as React.CSSProperties;

export function WelcomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  return (
    <AuthStage>
      <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 md:px-10">
        <KallanLogo className="k-up" />
        {user ? (
          <div className="flex items-center gap-2">
            <Button variant="glass" size="sm" asChild>
              <Link to="/inicio">
                Minha conta <ArrowRight />
              </Link>
            </Button>
            <Button variant="ghost" size="icon-sm" title="Sair" aria-label="Sair" onClick={() => void signOutEverywhere(qc, navigate)}>
              <LogOut />
            </Button>
          </div>
        ) : (
          <Button variant="glass" size="sm" asChild>
            <Link to="/auth" search={{ mode: "entrar" }}>
              Entrar <ArrowRight />
            </Link>
          </Button>
        )}
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-14 pt-10 md:px-10 md:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="k-up mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/60 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-brand shadow-[0_0_10px_2px_rgba(165,129,247,0.8)]" />
            INTELIGÊNCIA PARA A SUA VIDA FINANCEIRA
          </div>
          <h1 className="k-up font-display text-6xl font-semibold leading-[1.02] tracking-tight md:text-8xl" style={delay(1)}>
            Kallan
            <br />
            Finance<span className="k-shine">.</span>
          </h1>
          <p className="k-up mt-6 max-w-md text-xl leading-relaxed md:text-2xl" style={delay(2)}>
            Seu dinheiro. Seu negócio.
            <br />
            <span className="k-shine">Seu próximo passo.</span>
          </p>
          <p className="k-up mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground" style={delay(3)}>
            Todas as suas finanças. Uma nova forma de entender seu dinheiro e construir o que vem depois.
          </p>
          <div className="k-up mt-8 flex flex-wrap gap-3" style={delay(4)}>
            <Button variant="hero" size="lg" asChild>
              {user ? (
                <Link to="/inicio">
                  Acessar minhas finanças <ArrowRight />
                </Link>
              ) : (
                <Link to="/auth" search={{ mode: "criar" }}>
                  Começar agora <ArrowRight />
                </Link>
              )}
            </Button>
            {!user && (
              <Button variant="glass" size="lg" asChild>
                <Link to="/auth" search={{ mode: "entrar" }}>
                  Já tenho conta
                </Link>
              </Button>
            )}
          </div>
          <p className="k-up mt-6 flex items-center gap-2 text-xs text-muted-foreground" style={delay(5)}>
            <ShieldCheck className="size-4 text-brand" />
            Seu dinheiro continua onde está. Seu controle começa aqui.
          </p>
        </div>

        <div className="relative hidden h-[420px] lg:block" aria-hidden="true">
          <div className="k-orbit absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.6]">
            <i />
            <span>
              <Sparkles />
            </span>
          </div>
          <span className="k-chip absolute left-2 top-10" style={{ "--d": "0s" } as React.CSSProperties}>
            <Wallet /> Contas
          </span>
          <span className="k-chip absolute right-0 top-24" style={{ "--d": "1.5s" } as React.CSSProperties}>
            <Target /> Metas
          </span>
          <span className="k-chip absolute bottom-16 left-10" style={{ "--d": "3s" } as React.CSSProperties}>
            <ChartNoAxesCombined /> Clareza
          </span>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-10 md:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((x, i) => (
            <div key={x.title} className="k-up lift rounded-[22px] border border-border-strong bg-surface/60 p-5 backdrop-blur" style={delay(6 + i)}>
              <x.icon className="mb-3 size-5 text-brand" />
              <h2 className="text-base font-medium">{x.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.text}</p>
            </div>
          ))}
        </div>
        <footer className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kallan Finance · Plataforma independente de gestão e inteligência financeira.
        </footer>
      </section>
    </AuthStage>
  );
}
