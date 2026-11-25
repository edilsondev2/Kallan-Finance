import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KallanLogo } from "@/components/kallan/logo";
import heroImg from "@/assets/hero-woman.jpg";
import { useAuth } from "@/modules/auth/auth-context";

const searchSchema = z.object({ mode: z.enum(["entrar", "criar"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Kallan Finance" },
      { name: "description", content: "Acesse sua conta Kallan Finance ou crie uma nova em poucos segundos." },
      { property: "og:title", content: "Entrar — Kallan Finance" },
      { property: "og:description", content: "Acesse sua conta Kallan Finance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Digite um e-mail válido").max(255);
const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(72, "Senha muito longa")
  .regex(/[A-Za-z]/, "Inclua pelo menos uma letra")
  .regex(/[0-9]/, "Inclua pelo menos um número");
const nameSchema = z.string().trim().min(2, "Digite seu nome").max(80, "Nome muito longo");

type View = "entrar" | "criar" | "recuperar" | "verifique";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [view, setView] = useState<View>(search.mode ?? "entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { user, ready } = useAuth();

  // Already signed in (or returning from Google): go straight to the app.
  useEffect(() => {
    if (ready && user) navigate({ to: "/inicio", replace: true });
  }, [ready, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const em = emailSchema.safeParse(email);
    if (!em.success) errs["email"] = em.error.issues[0]?.message ?? "E-mail inválido";
    if (view === "criar") {
      const n = nameSchema.safeParse(name);
      if (!n.success) errs["name"] = n.error.issues[0]?.message ?? "Nome inválido";
      const p = passwordSchema.safeParse(password);
      if (!p.success) errs["password"] = p.error.issues[0]?.message ?? "Senha inválida";
    } else if (view === "entrar" && !password) {
      errs["password"] = "Digite sua senha";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      if (view === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding", data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/onboarding" });
        else setView("verifique");
      } else if (view === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          if (error.message.toLowerCase().includes("confirm")) throw new Error("Confirme seu e-mail pelo link que enviamos antes de entrar.");
          throw new Error("E-mail ou senha incorretos.");
        }
        navigate({ to: "/inicio" });
      } else if (view === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Se houver uma conta com este e-mail, enviaremos um link para redefinir a senha.");
        setView("entrar");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível concluir. Tente novamente.";
      toast.error(msg.includes("already registered") ? "Este e-mail já tem uma conta. Tente entrar." : msg);
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/inicio" });
  }

  const titles: Record<View, [string, string]> = {
    entrar: ["Bem-vindo de volta", "Entre para ver sua vida financeira em um só lugar."],
    criar: ["Crie sua conta", "Só o essencial: nome, e-mail e senha."],
    recuperar: ["Recuperar senha", "Enviaremos um link seguro para o seu e-mail."],
    verifique: ["Confirme seu e-mail", "Enviamos um link de confirmação. Abra-o para ativar sua conta."],
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={heroImg} alt="Mulher empreendedora consultando o aplicativo no celular" className="absolute inset-0 size-full object-cover object-[70%_20%]" />
        <div className="absolute inset-0 bg-fade-left" />
        <div className="absolute inset-0 bg-fade-bottom opacity-70" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/">
            <KallanLogo />
          </Link>
          <div className="max-w-md animate-rise">
            <p className="text-label text-primary-glow">Kallan Finance</p>
            <p className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight">
              Seu dinheiro. Seu negócio. <span className="text-gradient">Seu próximo passo.</span>
            </p>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-50 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
        <div className="relative flex items-center justify-between lg:hidden">
          <Link to="/">
            <KallanLogo />
          </Link>
        </div>
        <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {view !== "entrar" && view !== "criar" && (
            <button onClick={() => setView("entrar")} className="press mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" /> Voltar para entrar
            </button>
          )}
          <h1 className="font-display text-3xl font-semibold tracking-tight animate-rise">{titles[view][0]}</h1>
          <p className="mt-2 text-sm text-muted-foreground animate-rise">{titles[view][1]}</p>

          {(view === "entrar" || view === "criar") && (
            <div className="mt-8 grid grid-cols-2 rounded-full border border-border bg-surface p-1" role="tablist">
              {(["entrar", "criar"] as const).map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => {
                    setView(v);
                    setErrors({});
                  }}
                  className={`press rounded-full py-2 text-sm font-medium transition-colors ${view === v ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {v === "entrar" ? "Entrar" : "Criar conta"}
                </button>
              ))}
            </div>
          )}

          {view === "verifique" ? (
            <div className="surface-card mt-8 flex flex-col items-center p-8 text-center animate-rise">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary-glow">
                <Mail className="size-6" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Enviamos para <span className="text-foreground">{email}</span>. Depois de confirmar, você volta direto para o app.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              {view === "criar" && (
                <Field id="name" label="Nome" error={errors["name"]}>
                  <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors["name"]} placeholder="Como devemos te chamar?" />
                </Field>
              )}
              <Field id="email" label="E-mail" error={errors["email"]}>
                <Input id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors["email"]} placeholder="voce@email.com" />
              </Field>
              {view !== "recuperar" && (
                <Field
                  id="password"
                  label="Senha"
                  error={errors["password"]}
                  hint={view === "criar" ? "Mínimo de 8 caracteres, com letras e números." : undefined}
                  extra={
                    view === "entrar" ? (
                      <button type="button" onClick={() => setView("recuperar")} className="text-xs text-primary hover:underline">
                        Esqueci minha senha
                      </button>
                    ) : null
                  }
                >
                  <Input id="password" type="password" autoComplete={view === "criar" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors["password"]} placeholder="••••••••" />
                </Field>
              )}
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {view === "entrar" ? "Entrar" : view === "criar" ? "Criar conta" : "Enviar link"}
              </Button>
            </form>
          )}

          {(view === "entrar" || view === "criar") && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onGoogle} disabled={busy}>
                <GoogleIcon /> Continuar com Google
              </Button>
            </>
          )}

          <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            O Kallan nunca pede senha bancária. Conexões com instituições acontecem apenas pelo canal oficial de cada instituição.
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  extra,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        {extra}
      </div>
      {children}
      {error ? <p className="text-xs text-negative">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
