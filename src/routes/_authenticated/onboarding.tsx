import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Briefcase, Check, LineChart, Loader2, PieChart, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KallanLogo } from "@/components/kallan/logo";
import { AuthStage } from "@/components/kallan/stage";
import { useMyProfile, useUpdateSettings, type MainGoal } from "@/modules/settings/queries";
import { firstName } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Boas-vindas — Kallan Finance" },
      { name: "description", content: "Personalize sua experiência no Kallan Finance." },
      { property: "og:title", content: "Boas-vindas — Kallan Finance" },
      { property: "og:description", content: "Escolha seu principal objetivo financeiro no Kallan Finance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const GOALS: { value: MainGoal; label: string; desc: string; icon: LucideIcon }[] = [
  { value: "organize", label: "Organizar minhas finanças", desc: "Contas, gastos e metas no lugar certo.", icon: BarChart3 },
  { value: "understand_spending", label: "Entender meus gastos", desc: "Saber para onde o dinheiro está indo.", icon: PieChart },
  { value: "investments", label: "Acompanhar meus investimentos", desc: "Ver a evolução do que você guarda.", icon: LineChart },
  { value: "business", label: "Organizar meu negócio", desc: "Receitas, despesas e resultado do seu negócio.", icon: Briefcase },
  { value: "all", label: "Utilizar todas as funcionalidades", desc: "Quero explorar tudo o que o Kallan oferece.", icon: Sparkles },
];

const STEPS = [
  { title: "Tudo em um só lugar", text: "Contas, cartões, investimentos e o seu negócio, organizados com clareza." },
  { title: "Inteligência que explica", text: "O Kallan Intelligence interpreta seus números e sugere próximos passos, sem inventar valores." },
  { title: "Você no controle", text: "Conecte instituições só se quiser, pelo canal oficial. Você pode revogar quando quiser." },
];

const STEP_ICONS: LucideIcon[] = [Wallet, Sparkles, ShieldCheck];

function Onboarding() {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const update = useUpdateSettings();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<MainGoal | null>(null);

  async function finish(selected: MainGoal | null) {
    try {
      await update.mutateAsync({ onboarding_completed: true, main_goal: selected });
      navigate({ to: selected === "business" ? "/negocios" : "/inicio", replace: true });
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    }
  }

  const total = STEPS.length + 1;

  return (
    <AuthStage className="flex flex-col">
      <div className="relative flex min-h-dvh flex-col px-5 py-6">
        <header className="relative mx-auto flex w-full max-w-xl items-center justify-between">
          <KallanLogo />
          <button onClick={() => finish(goal)} className="press text-sm text-muted-foreground hover:text-foreground" disabled={update.isPending}>
            Pular
          </button>
        </header>

        <div className="relative mx-auto mt-6 flex w-full max-w-xl gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label={`Etapa ${step + 1} de ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={cn("k-seg", i <= step && "on")}>
              <i />
            </span>
          ))}
        </div>

        <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">
          {step < STEPS.length ? (
            <div key={step} className="k-swap text-center">
              <div className="k-orbit mb-8">
                <i />
                <span>{(() => { const Icon = STEP_ICONS[step] ?? Sparkles; return <Icon />; })()}</span>
              </div>
              {step === 0 && <p className="text-sm text-brand">Olá{profile?.display_name ? `, ${firstName(profile.display_name)}` : ""} 👋</p>}
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{STEPS[step]!.title}</h1>
              <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">{STEPS[step]!.text}</p>
            </div>
          ) : (
            <div className="k-swap">
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Qual é o seu principal objetivo?</h1>
              <p className="mt-2 text-sm text-muted-foreground">Vamos adaptar as sugestões da sua tela inicial. Você pode mudar depois.</p>
              <div className="mt-6 grid gap-2.5" role="radiogroup">
                {GOALS.map((g, i) => {
                  const active = goal === g.value;
                  return (
                    <button key={g.value} type="button" role="radio" aria-checked={active} onClick={() => setGoal(g.value)} style={{ "--n": i } as React.CSSProperties} className="k-goal">
                      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors", active ? "bg-brand text-[#0b0614]" : "bg-surface-2 text-brand")}>
                        <g.icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{g.label}</span>
                        <span className="block text-xs text-muted-foreground">{g.desc}</span>
                      </span>
                      <span className="k-check">
                        <Check className="size-3.5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        <footer className="relative mx-auto w-full max-w-xl pb-[env(safe-area-inset-bottom)]">
          {step < STEPS.length ? (
            <Button variant="hero" size="lg" className="w-full" onClick={() => setStep((s) => s + 1)}>
              Continuar <ArrowRight />
            </Button>
          ) : (
            <Button variant="hero" size="lg" className="w-full" onClick={() => finish(goal)} disabled={!goal || update.isPending}>
              {update.isPending && <Loader2 className="animate-spin" />} Começar a usar
            </Button>
          )}
        </footer>
      </div>
    </AuthStage>
  );
}
