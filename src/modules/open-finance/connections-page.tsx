import { useState, type CSSProperties } from "react";
import { Clock, KeyRound, Landmark, ShieldCheck, Unplug } from "lucide-react";
import { Page } from "@/components/kallan/page";
import { Button } from "@/components/ui/button";
import { ConnectFlow } from "./connect-flow";
import { OPEN_FINANCE_READINESS } from "./provider";

const TRUST = [
  { icon: ShieldCheck, title: "Somente leitura", text: "Contas, saldos, movimentações, faturas e investimentos, conforme o que cada instituição compartilhar." },
  { icon: KeyRound, title: "Autorização oficial", text: "O consentimento acontece pelo canal da instituição. Nunca solicitamos sua senha bancária." },
  { icon: Unplug, title: "Controle do consentimento", text: "Permissões e validade serão mostradas com os dados reais do provedor. A revogação seguirá seu fluxo oficial." },
] as const;

export function ConnectionsPage() {
  const [open, setOpen] = useState(false);
  const available = OPEN_FINANCE_READINESS.available;

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
          {available ? "Conectar instituição" : "Ver como será a conexão"}
        </Button>
        {!available && (
          <div className="k-cn-status">
            <p>
              <Clock aria-hidden="true" /> Conexões reais aguardando configuração do provedor
            </p>
            <ul>
              {OPEN_FINANCE_READINESS.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
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

      {open && <ConnectFlow onClose={() => setOpen(false)} />}
    </Page>
  );
}
