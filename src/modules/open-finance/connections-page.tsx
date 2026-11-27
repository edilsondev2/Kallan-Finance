import { useState, type CSSProperties } from "react";
import { Clock, FlaskConical, KeyRound, Landmark, ScanSearch, ShieldCheck, Trash2, Unplug, RefreshCw } from "lucide-react";
import { Page } from "@/components/kallan/page";
import { Button } from "@/components/ui/button";
import { ConnectFlow } from "./connect-flow";
import { ConnectionInspector } from "./inspector";
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useUserId } from '@/modules/auth/auth-context';
import { toast } from 'sonner';
import { institutionsOptions, connectionsOptions } from './queries';
import { refreshConnection, revokeConnection } from './open-finance.functions';

const TRUST = [
  { icon: ShieldCheck, title: "Somente leitura", text: "Contas, saldos, movimentações, faturas e investimentos, conforme o que cada instituição compartilhar." },
  { icon: KeyRound, title: "Autorização oficial", text: "O consentimento acontece pelo canal da instituição. Nunca solicitamos sua senha bancária." },
  { icon: Unplug, title: "Controle do consentimento", text: "Permissões e validade serão mostradas com os dados reais do provedor. A revogação seguirá seu fluxo oficial." },
] as const;

export function ConnectionsPage() {
  const [open, setOpen] = useState(false);
  const userId = useUserId();
  const qc = useQueryClient();
  const { data: institutions } = useSuspenseQuery(institutionsOptions(userId));
  const { data: connections } = useSuspenseQuery(connectionsOptions(userId));
  const refresh = useServerFn(refreshConnection);
  const revoke = useServerFn(revokeConnection);
  const [busy, setBusy] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<{ id: string; name: string } | null>(null);
  const available = institutions.length > 0;
  async function action(id: string, remove: boolean) {
    const test = connections.find(c => c.id === id)?.provider === 'malvo_sandbox';
    if (remove && !window.confirm(test ? 'Remover esta conexão de teste e todos os dados de teste importados dela?' : 'Revogar o compartilhamento desta instituição?')) return;
    setBusy(id);
    try {
      if (remove) await revoke({ data: { connectionId: id } });
      else {
        const res = await refresh({ data: { connectionId: id } });
        const s = res.sync;
        toast.success(s ? `Dados atualizados: ${s.accounts} conta(s), ${s.cards} cartão(ões), ${s.investments} investimento(s), ${s.transactions} movimentação(ões).` : 'Status atualizado.');
      }
      await Promise.all([qc.invalidateQueries({ queryKey: ['of-connections', userId] }), qc.invalidateQueries({ queryKey: ['finance', userId] })]);
    } catch { toast.error('Não foi possível atualizar a conexão.'); }
    finally { setBusy(null); }
  }
  const labels: Record<string, string> = { completed: 'Autorizada pelo provedor', verifying: 'Dados parcialmente disponíveis', syncing: 'Sincronizando no provedor', connecting: 'Conectando', awaiting_authorization: 'Aguardando autorização', failed: 'Falha', consent_expired: 'Consentimento encerrado', revoked: 'Revogada', preparing: 'Preparando' };

  return (
    <Page>
      <section className="k-cn-hero k-up">
        <i className="k-hx-orb" aria-hidden="true" />
        <div className="k-orbit k-cn-hero-orbit">
          <i />
          <span>
            <Landmark />
          </span>
        </div>
        <p className="k-cn-eyebrow">Open Finance</p>
        <h1>Conecte seus bancos, com você no controle</h1>
        <p className="k-cn-hero-text">Uma visão consolidada das suas contas, com autorização oficial e somente para leitura.</p>
        <Button variant="hero" size="lg" onClick={() => setOpen(true)}>
          {available ? "Conectar instituição" : "Consultar instituições"}
        </Button>
        {!available && (
          <div className="k-cn-status">
            <p>
              <Clock aria-hidden="true" /> Credenciais verificadas · Bancos reais ainda não habilitados
            </p>
            <p>A Malvo retornou apenas instituições de teste. É necessário habilitar a cobertura real na sua conta Malvo antes de conectar bancos.</p>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {TRUST.map((t, i) => (
          <div key={t.title} className="k-cn-trust k-up" style={{ "--n": i + 2 } as CSSProperties}>
            <t.icon aria-hidden="true" />
            <h2>{t.title}</h2>
            <p>{t.text}</p>
          </div>
        ))}
      </section>

      {connections.length > 0 && <section className="mt-8">
        <h2 className="text-lg font-semibold">Suas conexões</h2>
        <p className="mt-2 text-sm text-muted-foreground">Os dados importados aparecem no Início, na Carteira e no Extrato. Conexões de teste ficam marcadas como teste e podem ser removidas.</p>
        {connections.map(c => <div key={c.id} className="flex flex-wrap items-center gap-3 border-b border-border py-4">
          <div className="min-w-0 flex-1">
            <h3 className="flex flex-wrap items-center gap-2 font-medium">{c.institution_name}{c.provider === 'malvo_sandbox' && <span className="inline-flex items-center gap-1 rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-medium text-muted-foreground"><FlaskConical className="size-3" aria-hidden="true" /> teste</span>}</h3>
            <p className="text-sm text-muted-foreground">{labels[c.status] ?? c.status}{c.last_sync_at ? ` · atualizado em ${new Date(c.last_sync_at).toLocaleString('pt-BR')}` : ''}</p>
          </div>
          {c.status !== 'revoked' && <Button variant="ghost" size="icon" aria-label={`Conferir dados de ${c.institution_name}`} title="Conferir dados recebidos" onClick={() => setInspecting({ id: c.id, name: c.institution_name })}><ScanSearch /></Button>}
          <Button variant="ghost" size="icon" aria-label={`Atualizar dados de ${c.institution_name}`} title="Atualizar dados" disabled={busy === c.id} onClick={() => void action(c.id, false)}><RefreshCw className={busy === c.id ? 'animate-spin' : ''} /></Button>
          {c.status !== 'revoked' && <Button variant="ghost" size="icon" aria-label={c.provider === 'malvo_sandbox' ? `Remover conexão de teste ${c.institution_name}` : `Revogar ${c.institution_name}`} title={c.provider === 'malvo_sandbox' ? 'Remover conexão e dados de teste' : 'Revogar consentimento'} disabled={busy === c.id} onClick={() => void action(c.id, true)}>{c.provider === 'malvo_sandbox' ? <Trash2 /> : <Unplug />}</Button>}
        </div>)}
      </section>}
      {open && <ConnectFlow onClose={() => setOpen(false)} />}
      {inspecting && <ConnectionInspector connectionId={inspecting.id} name={inspecting.name} onClose={() => setInspecting(null)} />}
    </Page>
  );
}
