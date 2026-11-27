import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowLeft, ArrowLeftRight, Building2, Check, ChevronRight, Loader2, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { KallanGlyph } from "@/components/kallan/logo";
import { Button } from "@/components/ui/button";
import { useUserId } from "@/modules/auth/auth-context";
import { cn } from "@/lib/utils";
import type { OpenFinanceInstitution } from "./provider";
import { createConnectToken, listOpenFinanceInstitutions, openFinanceDiagnostics, registerConnection } from "./open-finance.functions";
import { openMalvoWidget } from "./widget";

type Step = "bank" | "review" | "authorizing" | "verifying" | "done" | "failed";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function InstitutionAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const words = name.trim().split(/\s+/);
  const initials = ((words[0]?.charAt(0) ?? '') + (words[1]?.charAt(0) ?? '')).toUpperCase();
  return <span className="k-cn-av bg-surface-2 text-foreground" style={{ width: size, height: size, fontSize: size * .34 }} aria-hidden="true">{initials}</span>;
}

export function ConnectFlow({ onClose }: { onClose: () => void }) {
  const userId = useUserId();
  const qc = useQueryClient();
  const listFn = useServerFn(listOpenFinanceInstitutions);
  const tokenFn = useServerFn(createConnectToken);
  const registerFn = useServerFn(registerConnection);
  const diagFn = useServerFn(openFinanceDiagnostics);

  const [step, setStep] = useState<Step>("bank");
  const [picked, setPicked] = useState<OpenFinanceInstitution | null>(null);
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const institutions = useQuery({ queryKey: ["of-institutions", userId], queryFn: () => listFn(), staleTime: 5 * 60_000 });
  const all = institutions.data ?? [];
  const noneListed = institutions.isSuccess && all.length === 0;
  const diag = useQuery({ queryKey: ["of-diagnostics", userId], queryFn: () => diagFn(), enabled: noneListed, staleTime: 60_000 });
  const products = useMemo(() => [...new Set(all.flatMap((i) => i.products))], [all]);
  const shown = useMemo(() => {
    const q = norm(query.trim());
    return all.filter((i) => (!q || norm(i.name).includes(q)) && (!product || i.products.includes(product)));
  }, [all, query, product]);

  const sheetOpen = step !== "bank";
  const busy = step === "authorizing" || step === "verifying";
  const back = () => {
    if (busy) return;
    if (step === "review") setStep("bank");
    else onClose();
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && back();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  });

  async function verify(itemId: string) {
    setStep("verifying");
    try {
      const row = await registerFn({ data: { itemId } });
      await qc.invalidateQueries({ queryKey: ["of-connections", userId] });
      setResult(row.status);
      setStep(row.status === "failed" || row.status === "consent_expired" ? "failed" : "done");
    } catch {
      setStep("failed");
    }
  }

  async function proceed() {
    if (!picked) return;
    setStep("authorizing");
    try {
      const { connectToken } = await tokenFn({ data: { institutionId: picked.id } });
      let finished = false;
      await openMalvoWidget({
        connectToken,
        connectorId: Number(picked.id) || undefined,
        includeSandbox: picked.sandbox === true,
        onSuccess: (itemId) => { finished = true; void verify(itemId); },
        onError: () => { finished = true; setStep("failed"); },
        onClose: () => { if (!finished) setStep("review"); },
      });
    } catch {
      setStep("failed");
    }
  }

  const stepIndex = step === "bank" ? 0 : step === "review" ? 1 : 2;
  const sheetLabel = { review: "Conectar conta", authorizing: "Aguardando autorização", verifying: "Verificando conexão", done: "Conexão registrada", failed: "Falha na conexão", bank: "" }[step];

  return (
    <div className="k-cn" role="dialog" aria-modal="true" aria-label="Conectar instituição">
      <div className="k-px" aria-hidden="true" />
      <div className="k-cn-col">
        <header className="k-cn-head">
          <Button variant="ghost" type="button" className="k-icon-btn" onClick={() => (sheetOpen ? back() : onClose())} aria-label={sheetOpen ? "Voltar" : "Fechar"}>
            {sheetOpen ? <ArrowLeft /> : <X />}
          </Button>
          <div className="k-cn-steps" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={stepIndex + 1} aria-label={`Etapa ${stepIndex + 1} de 3`}>
            {[0, 1, 2].map((i) => (
              <i key={i} className={cn(i <= stepIndex && "on")} />
            ))}
          </div>
          <span className="w-[46px]" />
        </header>

        <h1 className="k-cn-title k-up">Selecione sua instituição</h1>
        <p className="k-cn-sub k-up" style={{ "--n": 1 } as CSSProperties}>
          Escolha onde você é cliente. A autorização acontece no canal oficial da instituição, somente para leitura.
        </p>

        <div className="k-cn-searchrow k-up" style={{ "--n": 2 } as CSSProperties}>
          <label className="k-cn-search">
            <Search aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar instituição" aria-label="Buscar instituição" autoComplete="off" />
            {query && (
              <Button variant="ghost" type="button" onClick={() => setQuery("")} aria-label="Limpar busca">
                <X />
              </Button>
            )}
          </label>
          <Button variant="ghost" type="button" className={cn("k-icon-btn k-cn-filter", (filtersOpen || product) && "on")} onClick={() => setFiltersOpen((v) => !v)} aria-label="Filtrar por tipo de dado" aria-expanded={filtersOpen}>
            <SlidersHorizontal />
            {product && <i />}
          </Button>
        </div>

        {filtersOpen && (
          <div className="k-cn-filters k-swap" role="group" aria-label="Filtrar por tipo de dado">
            {products.map((p) => (
              <Button variant="ghost" key={p} type="button" className={cn("k-cn-pill", product === p && "on")} aria-pressed={product === p} onClick={() => setProduct(product === p ? null : p)}>
                {p}
              </Button>
            ))}
            {product && (
              <Button variant="ghost" type="button" className="k-cn-pill clear" onClick={() => setProduct(null)}>
                Limpar
              </Button>
            )}
          </div>
        )}

        <div className="k-cn-list" aria-live="polite">
          {institutions.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="k-cn-bank skeleton" style={{ height: 76 }} />)
          ) : institutions.isError ? (
            <div className="k-cn-empty">
              <b>Não foi possível carregar as instituições.</b>
              <Button variant="ghost" type="button" className="k-lnk" onClick={() => void institutions.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : shown.length ? (
            shown.map((inst, i) => (
              <Button variant="ghost" key={inst.id} type="button" className="k-cn-bank k-up" style={{ "--n": Math.min(i, 10) } as CSSProperties} onClick={() => { setPicked(inst); setStep("review"); }}>
                <InstitutionAvatar name={inst.name}  />
                <span className="k-cn-bank-body">
                  <b>{inst.name}</b>
                  <small>{inst.sandbox ? "Ambiente de testes · " : ""}{inst.products.join(" · ")}</small>
                </span>
                <ChevronRight aria-hidden="true" />
              </Button>
            ))
          ) : (
            <div className="k-cn-empty">
              <b>{all.length ? "Nenhuma instituição encontrada." : "Conexões reais ainda não habilitadas."}</b>
              {all.length ? "Confira o nome ou limpe os filtros." : "Nenhuma instituição real foi retornada pelo provedor para esta conta."}
              {!all.length && diag.data && (
                <details className="mt-4 text-left text-xs">
                  <summary className="cursor-pointer text-center">Detalhes técnicos</summary>
                  <p className="mt-2">Modo de teste: <b>{diag.data.sandboxMode ? "ligado" : "desligado (secret OPEN_FINANCE_SANDBOX não lido)"}</b></p>
                  <ul className="mt-2 space-y-1.5">
                    {diag.data.probes.map((p) => (
                      <li key={p.label}>
                        <b>{p.label}:</b> {p.ok ? `${p.total} conectores, ${p.sandbox} de teste${p.sample?.length ? ` (${p.sample.join(", ")})` : ""}` : `falhou (${p.error})`}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {sheetOpen && picked && (
        <div className="k-cn-wrap" onClick={(e) => { if (e.target === e.currentTarget) back(); }}>
          <div className="k-cn-sheet" role="dialog" aria-modal="true" aria-label={sheetLabel}>
            <div className="k-grab" />
            <div key={step} className="k-swap">
              {step === "review" && (
                <div>
                  <h2 className="k-cn-h2 center">Conectar conta</h2>
                  <div className="k-cn-link" aria-hidden="true">
                    <span className="k-cn-kmark"><KallanGlyph /></span>
                    <span className="k-cn-line"><i /><ArrowLeftRight /></span>
                    <InstitutionAvatar name={picked.name} size={64}  />
                  </div>
                  <div className="k-cn-card">
                    <Building2 aria-hidden="true" />
                    <div>
                      <b>{picked.name}</b>
                      <small>{picked.products.join(", ")} · Somente leitura · Validade definida pela instituição</small>
                    </div>
                  </div>
                  <Button variant="hero" size="lg" className="mt-5 w-full" onClick={() => void proceed()}>
                    Continuar
                  </Button>
                  <p className="k-cn-foot">
                    <ShieldCheck aria-hidden="true" />
                    {picked.sandbox ? "Ambiente de testes: nenhum dado real será conectado nem salvo. " : ""}Uma janela segura da Malvo vai abrir para você autorizar em {picked.name}. O Kallan nunca pede nem guarda sua senha bancária.
                  </p>
                </div>
              )}

              {(step === "authorizing" || step === "verifying") && (
                <div className="k-cn-done">
                  <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" aria-hidden="true" />
                  <h2 className="k-cn-h2 center">{step === "authorizing" ? "Aguardando autorização" : "Verificando com o provedor"}</h2>
                  <p>{step === "authorizing" ? "Conclua a autorização na janela da instituição. Se ela não abriu, confira se o navegador bloqueou pop-ups." : "Confirmando a conexão antes de mostrá-la como ativa."}</p>
                </div>
              )}

              {step === "done" && (
                <div className="k-cn-done">
                  <div className="k-orbit"><i /><span><Check /></span></div>
                  <h2 className="k-cn-h2 center">{result === "sandbox" ? "Teste concluído" : result === "completed" ? "Conexão concluída" : "Conexão em andamento"}</h2>
                  <p>{result === "sandbox" ? `O teste com ${picked.name} funcionou. Por ser um ambiente de testes, nada foi salvo na sua conta.` : result === "completed" ? `${picked.name} foi conectada e confirmada pelo provedor.` : `A autorização em ${picked.name} foi recebida. O provedor ainda está sincronizando; acompanhe o status na lista de conexões.`}</p>
                  <Button variant="hero" size="lg" className="mt-5 w-full" onClick={onClose}>Entendi</Button>
                </div>
              )}

              {step === "failed" && (
                <div className="k-cn-done">
                  <AlertTriangle className="mx-auto size-10 text-destructive" aria-hidden="true" />
                  <h2 className="k-cn-h2 center">Não foi possível conectar</h2>
                  <p>Nenhum dado foi importado. Você pode tentar de novo agora.</p>
                  <Button variant="hero" size="lg" className="mt-5 w-full" onClick={() => setStep("review")}>Tentar novamente</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
