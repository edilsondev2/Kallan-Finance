import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowLeftRight, Building2, Check, ChevronRight, Search, ShieldCheck, SlidersHorizontal, User, X } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge } from "@/components/kallan/badges";
import { KallanGlyph } from "@/components/kallan/logo";
import { Button } from "@/components/ui/button";
import { useUserId } from "@/modules/auth/auth-context";
import { useMyProfile } from "@/modules/settings/queries";
import { DEMO_INSTITUTIONS } from "@/modules/demo/institutions";
import { formatCpf, isValidCpf, maskCpf, onlyDigits } from "@/lib/cpf";
import { cn } from "@/lib/utils";
import { getOpenFinanceProvider, type OpenFinanceInstitution } from "./provider";

type Step = "bank" | "cpf" | "review" | "done";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Initials on a soft violet-gray gradient, stable per name. Real logos come with the provider later. */
export function InstitutionAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const words = name.replace(/\(.*?\)/g, "").trim().split(/\s+/);
  const initials = ((words[0]?.charAt(0) ?? "") + (words[1]?.charAt(0) ?? "")).toUpperCase();
  const h = hashOf(name);
  const style = {
    width: size,
    height: size,
    fontSize: size * 0.34,
    background: `linear-gradient(145deg, hsl(${255 + (h % 30)} 38% ${30 + (h % 10)}%), hsl(${250 + (h % 40)} 30% ${14 + (h % 6)}%))`,
  } as CSSProperties;
  return (
    <span className="k-cn-av" style={style} aria-hidden="true">
      {initials}
    </span>
  );
}

export function ConnectFlow({ onClose }: { onClose: () => void }) {
  const provider = getOpenFinanceProvider();
  const demo = provider === null;
  const userId = useUserId();
  const { data: profile } = useMyProfile();

  const [step, setStep] = useState<Step>("bank");
  const [picked, setPicked] = useState<OpenFinanceInstitution | null>(null);
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const institutions = useQuery({
    queryKey: ["of-institutions", demo],
    queryFn: () => (provider ? provider.listInstitutions() : Promise.resolve(DEMO_INSTITUTIONS)),
    staleTime: 5 * 60_000,
  });
  const all = institutions.data ?? [];
  const products = useMemo(() => [...new Set(all.flatMap((i) => i.products))], [all]);
  const shown = useMemo(() => {
    const q = norm(query.trim());
    return all.filter((i) => (!q || norm(i.name).includes(q)) && (!product || i.products.includes(product)));
  }, [all, query, product]);

  const sheetOpen = step !== "bank";
  const back = () => {
    if (step === "bank" || step === "done") onClose();
    else if (step === "cpf") setStep("bank");
    else setStep("cpf");
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "bank" || step === "done") onClose();
      else if (step === "cpf") setStep("bank");
      else setStep("cpf");
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [step, onClose]);

  function pick(inst: OpenFinanceInstitution) {
    setPicked(inst);
    setCpfError(undefined);
    setStep("cpf");
  }

  function submitCpf(e: FormEvent) {
    e.preventDefault();
    if (!isValidCpf(cpf)) {
      setCpfError("Digite um CPF válido.");
      return;
    }
    setCpfError(undefined);
    setStep("review");
  }

  async function proceed() {
    if (!picked) return;
    if (!provider) {
      setStep("done");
      return;
    }
    setBusy(true);
    try {
      const { authorizationUrl } = await provider.startConsent({
        institutionId: picked.id,
        userId,
        returnUrl: `${window.location.origin}/open-finance`,
        taxId: onlyDigits(cpf),
      });
      window.location.assign(authorizationUrl);
    } catch {
      toast.error("Não foi possível iniciar a conexão. Tente novamente.");
      setBusy(false);
    }
  }

  const stepIndex = step === "bank" ? 0 : step === "cpf" ? 1 : 2;
  const holder = profile?.display_name?.trim() || "Titular da conta";

  return (
    <div className="k-cn" role="dialog" aria-modal="true" aria-label="Conectar instituição">
      <div className="k-px" aria-hidden="true" />
      <div className="k-cn-col">
        <header className="k-cn-head">
          <button type="button" className="k-icon-btn" onClick={() => (sheetOpen ? back() : onClose())} aria-label={sheetOpen ? "Voltar" : "Fechar"}>
            {sheetOpen ? <ArrowLeft /> : <X />}
          </button>
          <div className="k-cn-steps" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={stepIndex + 1} aria-label={`Etapa ${stepIndex + 1} de 3`}>
            {[0, 1, 2].map((i) => (
              <i key={i} className={cn(i <= stepIndex && "on")} />
            ))}
          </div>
          {demo ? <DemoBadge /> : <span className="w-[46px]" />}
        </header>

        <h1 className="k-cn-title k-up">Selecione sua instituição</h1>
        <p className="k-cn-sub k-up" style={{ "--n": 1 } as CSSProperties}>
          Escolha onde você é cliente para trazer seus dados de contas pessoa física (PF). Acesso somente para leitura.
        </p>

        <div className="k-cn-searchrow k-up" style={{ "--n": 2 } as CSSProperties}>
          <label className="k-cn-search">
            <Search aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar instituição" aria-label="Buscar instituição" autoComplete="off" />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">
                <X />
              </button>
            )}
          </label>
          <button type="button" className={cn("k-icon-btn k-cn-filter", (filtersOpen || product) && "on")} onClick={() => setFiltersOpen((v) => !v)} aria-label="Filtrar por tipo de dado" aria-expanded={filtersOpen}>
            <SlidersHorizontal />
            {product && <i />}
          </button>
        </div>

        {filtersOpen && (
          <div className="k-cn-filters k-swap" role="group" aria-label="Filtrar por tipo de dado">
            {products.map((p) => (
              <button key={p} type="button" className={cn("k-cn-pill", product === p && "on")} aria-pressed={product === p} onClick={() => setProduct(product === p ? null : p)}>
                {p}
              </button>
            ))}
            {product && (
              <button type="button" className="k-cn-pill clear" onClick={() => setProduct(null)}>
                Limpar
              </button>
            )}
          </div>
        )}

        <div className="k-cn-list" aria-live="polite">
          {institutions.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="k-cn-bank skeleton" style={{ height: 76 }} />)
          ) : institutions.isError ? (
            <div className="k-cn-empty">
              <b>Não foi possível carregar as instituições.</b>
              <button type="button" className="k-lnk" onClick={() => void institutions.refetch()}>
                Tentar novamente
              </button>
            </div>
          ) : shown.length ? (
            shown.map((inst, i) => (
              <button key={inst.id} type="button" className="k-cn-bank k-up" style={{ "--n": Math.min(i, 10) } as CSSProperties} onClick={() => pick(inst)}>
                <InstitutionAvatar name={inst.name} />
                <span className="k-cn-bank-body">
                  <b>{inst.name}</b>
                  <small>{inst.products.join(" · ")}</small>
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            ))
          ) : (
            <div className="k-cn-empty">
              <b>Nenhuma instituição encontrada.</b>
              {demo && query
                ? "Esta é uma pré-visualização com instituições de exemplo. As instituições reais, como a que você buscou, aparecem quando a conexão com o provedor for ativada."
                : "Confira o nome ou limpe os filtros."}
            </div>
          )}
        </div>
      </div>

      {sheetOpen && picked && (
        <div
          className="k-cn-wrap"
          onClick={(e) => {
            if (e.target === e.currentTarget) back();
          }}
        >
          <div className="k-cn-sheet" role="dialog" aria-modal="true" aria-label={step === "cpf" ? "Confirme seu CPF" : step === "review" ? "Conectar conta" : "Pré-visualização concluída"}>
            <div className="k-grab" />
            <div key={step} className="k-swap">
              {step === "cpf" && (
                <form onSubmit={submitCpf} noValidate>
                  <h2 className="k-cn-h2">Confirme seu CPF</h2>
                  <label className={cn("k-flt", cpfError && "bad")}>
                    <span>CPF</span>
                    <input
                      value={cpf}
                      onChange={(e) => {
                        setCpf(formatCpf(e.target.value));
                        setCpfError(undefined);
                      }}
                      inputMode="numeric"
                      autoComplete="off"
                      autoFocus
                      placeholder="000.000.000-00"
                      aria-invalid={!!cpfError}
                      aria-describedby="cpf-help"
                    />
                  </label>
                  <p id="cpf-help" className={cn("k-cn-help", cpfError && "bad")}>
                    {cpfError ?? `Usamos o CPF só para localizar sua conta em ${picked.name}. O Kallan não guarda esse número.`}
                  </p>
                  <Button type="submit" variant="hero" size="lg" className="mt-5 w-full">
                    Continuar
                  </Button>
                </form>
              )}

              {step === "review" && (
                <div>
                  <h2 className="k-cn-h2 center">Conectar conta</h2>
                  <div className="k-cn-link" aria-hidden="true">
                    <span className="k-cn-kmark">
                      <KallanGlyph />
                    </span>
                    <span className="k-cn-line">
                      <i />
                      <ArrowLeftRight />
                    </span>
                    <InstitutionAvatar name={picked.name} size={64} />
                  </div>
                  <div className="k-cn-card">
                    <User aria-hidden="true" />
                    <div>
                      <b>{holder}</b>
                      <small>CPF: {maskCpf(cpf)}</small>
                    </div>
                  </div>
                  <div className="k-cn-card">
                    <Building2 aria-hidden="true" />
                    <div>
                      <b>{picked.name}</b>
                      <small>
                        {picked.products.join(", ")} · Somente leitura · Validade definida pela instituição
                      </small>
                    </div>
                  </div>
                  <Button variant="hero" size="lg" className="mt-5 w-full" onClick={() => void proceed()} disabled={busy}>
                    {demo ? "Ver o próximo passo" : "Continuar"}
                  </Button>
                  <p className="k-cn-foot">
                    <ShieldCheck aria-hidden="true" />
                    {demo
                      ? "Pré-visualização: nada será enviado nem conectado. Quando o Open Finance estiver ativo, você será levado ao canal oficial da instituição."
                      : `Você será redirecionado para o canal oficial de ${picked.name} para autorizar. O Kallan nunca pede sua senha bancária.`}
                  </p>
                </div>
              )}

              {step === "done" && (
                <div className="k-cn-done">
                  <div className="k-orbit">
                    <i />
                    <span>
                      <Check />
                    </span>
                  </div>
                  <h2 className="k-cn-h2 center">Pré-visualização concluída</h2>
                  <p>
                    É assim que a conexão com {picked.name} vai funcionar quando o Open Finance for liberado. Nenhuma conexão foi criada e nenhum dado seu foi enviado.
                  </p>
                  <Button variant="hero" size="lg" className="mt-5 w-full" onClick={onClose}>
                    Entendi
                  </Button>
                  <Button variant="ghost" size="lg" className="mt-2 w-full" asChild>
                    <Link to="/carteira" onClick={onClose}>
                      Adicionar registro manual
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
