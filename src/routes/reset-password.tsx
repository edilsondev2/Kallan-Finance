import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KallanLogo } from "@/components/kallan/logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Kallan Finance" },
      { name: "description", content: "Defina uma nova senha para sua conta Kallan Finance." },
      { property: "og:title", content: "Redefinir senha — Kallan Finance" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(72)
  .regex(/[A-Za-z]/, "Inclua pelo menos uma letra")
  .regex(/[0-9]/, "Inclua pelo menos um número");

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && isRecovery) setReady(true);
      else if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(password);
    if (!r.success) return setError(r.error.issues[0]?.message ?? "Senha inválida");
    if (password !== confirm) return setError("As senhas não coincidem");
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return toast.error("Não foi possível atualizar a senha. Solicite um novo link.");
    toast.success("Senha atualizada com sucesso.");
    navigate({ to: "/inicio" });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5">
      <Link to="/" className="mb-10">
        <KallanLogo />
      </Link>
      <div className="surface-card w-full max-w-sm p-6 animate-rise">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary-glow">
          <LockKeyhole className="size-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Defina uma nova senha</h1>
        {!ready ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Abra esta página pelo link enviado ao seu e-mail. Se o link expirou,{" "}
            <Link to="/auth" className="text-primary hover:underline">
              solicite um novo
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="pw" className="text-xs text-muted-foreground">Nova senha</Label>
              <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2" className="text-xs text-muted-foreground">Confirme a senha</Label>
              <Input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Salvar nova senha
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
