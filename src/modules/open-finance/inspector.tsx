import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { inspectConnection } from "./open-finance.functions";

const same = (a: number | null, b: number | null) => a !== null && b !== null && Math.abs(a - b) < 0.01;

function Pair({ label, raw, stored, money = false }: { label: string; raw: number | null; stored: number | null; money?: boolean }) {
  const ok = same(raw, stored);
  const fmt = (n: number | null) => (n === null ? "—" : money ? formatBRL(n) : String(n));
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">
        <span className="block">
          Malvo: <b>{fmt(raw)}</b>
          {money && raw !== null ? <span className="text-xs text-muted-foreground"> (bruto {raw})</span> : null}
        </span>
        <span className={ok ? "block text-positive" : "block text-destructive"}>
          App: <b>{fmt(stored)}</b> {ok ? <Check className="inline size-3.5" aria-label="confere" /> : <AlertTriangle className="inline size-3.5" aria-label="diferente" />}
        </span>
      </span>
    </div>
  );
}

/** Side by side: what the provider says right now versus what Kallan stored. */
export function ConnectionInspector({ connectionId, name, onClose }: { connectionId: string; name: string; onClose: () => void }) {
  const inspectFn = useServerFn(inspectConnection);
  const q = useQuery({ queryKey: ["of-inspect", connectionId], queryFn: () => inspectFn({ data: { connectionId } }), staleTime: 0, gcTime: 0, retry: false });
  const d = q.data;
  return (
    <div className="k-cn-wrap" style={{ zIndex: 95 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="k-cn-sheet" role="dialog" aria-modal="true" aria-label={`Dados recebidos de ${name}`}>
        <div className="flex items-center justify-between">
          <h2 className="k-cn-h2" style={{ margin: "10px 0 6px" }}>Dados recebidos de {name}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar"><X /></Button>
        </div>
        {q.isLoading && <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Consultando a Malvo e comparando com o app…</p>}
        {q.isError && <p className="py-6 text-sm text-destructive">Não foi possível conferir os dados agora. Tente novamente em instantes.</p>}
        {d && (
          <div className="space-y-4 pb-2">
            <p className="text-sm text-muted-foreground">
              Situação na Malvo: <b className="text-foreground">{d.item.status}</b>
              {d.item.executionStatus ? ` · ${d.item.executionStatus}` : ""}
              {d.item.test ? " · conexão de teste" : ""}
            </p>
            {d.accounts.length === 0 && <p className="rounded-2xl border border-border p-4 text-sm">A Malvo não devolveu nenhuma conta para esta conexão.</p>}
            {d.accounts.map((a, i) => (
              <section key={`${a.name}-${i}`} className="rounded-2xl border border-border-strong p-4">
                <h3 className="font-medium">{a.name}</h3>
                <p className="text-xs text-muted-foreground">{a.type}{a.subtype ? ` · ${a.subtype}` : ""}{a.number ? ` · ${a.number}` : ""} · {a.currency}</p>
                <div className="mt-2 divide-y divide-border">
                  {a.kind === "bank" ? <Pair label="Saldo" raw={a.rawBalance} stored={a.storedBalance} money /> : <Pair label="Limite" raw={a.rawCreditLimit} stored={a.storedCreditLimit} money />}
                  <Pair label="Movimentações" raw={a.rawTransactions} stored={a.storedTransactions} />
                  {a.kind === "card" && <Pair label="Faturas" raw={a.rawBills === null ? null : a.rawBills} stored={a.storedInvoices} />}
                </div>
                {a.kind === "card" && <p className="mt-1 text-xs text-muted-foreground">No app, as faturas incluem a fatura aberta (calculada do saldo do cartão), por isso podem ter uma a mais que a Malvo.</p>}
              </section>
            ))}
            {d.investments.length > 0 && (
              <section className="rounded-2xl border border-border-strong p-4">
                <h3 className="font-medium">Investimentos</h3>
                <div className="mt-2 divide-y divide-border">
                  {d.investments.map((i, k) => <Pair key={`${i.name}-${k}`} label={i.name} raw={i.rawBalance} stored={i.storedAmount} money />)}
                </div>
              </section>
            )}
            {d.warnings.length > 0 && <p className="text-xs text-destructive">Avisos: {d.warnings.join("; ")}</p>}
            <p className="text-xs text-muted-foreground">Se o valor bruto estiver diferente do que o app guardou (por exemplo, 120950 contra R$ 120.950,00), me diga: pode ser a unidade (reais ou centavos).</p>
          </div>
        )}
      </div>
    </div>
  );
}
