import { formatBRL, formatDate, formatPercent, toNumber } from "@/lib/format";
import { categoryBreakdown, financialPosition, goalProgress, monthKeyOf, monthSummary, prevMonth } from "@/modules/finance/calculations";
import { dueLabel, upcomingInvoices } from "@/modules/finance/bills";
import type { FinanceData, FinanceMode } from "@/modules/finance/types";

/**
 * Kallan Intelligence replies. Every number comes from the deterministic calculations in
 * modules/finance; nothing here invents a value. The conversational AI plugs in later,
 * on top of the same results.
 */

export type Part = string | { b: string };
export type MiniRow = { icon: string; color: string; label: string; value: string; sub?: string };
export type Act = { label: string; ask?: string; to?: string };
export type Block =
  | { kind: "p"; parts: Part[] }
  | { kind: "mini"; rows: MiniRow[] }
  | { kind: "acts"; acts: Act[] };

export type ReplyInput = {
  data: FinanceData | null;
  mode: FinanceMode;
  now: Date;
  hidden: boolean;
  name: string;
  failed?: boolean;
};

export const SUGGESTIONS = [
  "Onde estou gastando mais?",
  "O que vence nos próximos dias?",
  "Como foi meu mês?",
  "Como estão minhas metas?",
  "Onde posso economizar?",
] as const;

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const b = (s: string): Part => ({ b: s });
const p = (...parts: Part[]): Block => ({ kind: "p", parts });
const acts = (...a: Act[]): Block => ({ kind: "acts", acts: a });
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const FIXED_COSTS = /moradia|aluguel|condom|saude|educa|imposto|seguro|financiamento/;

export function buildReply(question: string, input: ReplyInput): Block[] {
  const x = norm(question);
  const { data, mode, now, hidden } = input;
  const m = (n: number) => (hidden ? "R$ ••••••" : formatBRL(n));
  const demoNote: Block[] = mode === "demo" ? [p("Estes valores são de demonstração.")] : [];

  if (/^(oi|ola|opa|e ai|bom dia|boa tarde|boa noite)/.test(x)) {
    return [p(`Olá${input.name ? `, ${input.name}` : ""}. Posso mostrar seus gastos, o que vence nos próximos dias ou como estão suas metas. O que prefere?`)];
  }
  if (input.failed) {
    return [p("Não consegui carregar seus números agora. Tente de novo em instantes.")];
  }
  if (!data || mode === "empty") {
    return [
      p("Ainda não tenho números seus para analisar. Registre uma movimentação ou conecte uma instituição e eu passo a responder com os seus dados."),
      acts({ label: "Ver movimentações", to: "/movimentacoes" }, { label: "Conectar instituição", to: "/open-finance" }),
    ];
  }

  const ref = monthKeyOf(now);
  const cur = monthSummary(data.transactions, ref);
  const cats = categoryBreakdown(data.transactions, data.categories, ref);

  if (/vence|vencim|pagar|fatura|boleto|a pagar|proximos dias/.test(x)) {
    const bills = upcomingInvoices(data, now);
    if (!bills.length) return [p("Você não tem faturas em aberto agora."), ...demoNote];
    const total = bills.reduce((s, i) => s + i.amount, 0);
    const first = bills[0];
    return [
      p("Você tem ", b(`${bills.length} ${plural(bills.length, "fatura", "faturas")}`), " em aberto, somando ", b(m(total)), "."),
      {
        kind: "mini",
        rows: bills.slice(0, 4).map((i) => ({
          icon: "receipt",
          color: "slate",
          label: i.name,
          value: m(i.amount),
          sub: `${dueLabel(i.days)} · ${formatDate(i.due, { day: "2-digit", month: "short" })}`,
        })),
      },
      ...(first ? [p(`${first.name} é a primeira da fila.`)] : []),
      acts({ label: "Ver carteira", to: "/carteira" }),
      ...demoNote,
    ];
  }

  if (/economiz|cortar|reduzir|gastar menos/.test(x)) {
    const flex = cats.filter((c) => !FIXED_COSTS.test(norm(c.name))).slice(0, 4);
    if (!flex.length) return [p("Ainda não há saídas flexíveis neste mês para analisar."), ...demoNote];
    const base = flex.reduce((s, c) => s + c.total, 0);
    return [
      p("As categorias mais flexíveis do seu mês somam ", b(m(base)), "."),
      { kind: "mini", rows: flex.map((c) => ({ icon: c.icon, color: c.color, label: c.name, value: m(c.total) })) },
      p("Reduzir 10% nelas libera cerca de ", b(m(base * 0.1)), " por mês. Moradia, saúde e educação costumam ser mais difíceis de mexer."),
      acts({ label: "Ver movimentações", to: "/movimentacoes" }, { label: "Ver metas", to: "/metas" }),
      ...demoNote,
    ];
  }

  if (/gast|despes|categoria|onde .*(vai|foi|dinheiro)|maior/.test(x)) {
    const top = cats[0];
    if (!top) return [p("Você ainda não tem saídas registradas neste mês."), ...demoNote];
    return [
      p("Neste mês você gastou ", b(m(cur.expenses)), ". O que mais pesou:"),
      { kind: "mini", rows: cats.slice(0, 3).map((c) => ({ icon: c.icon, color: c.color, label: c.name, value: m(c.total), sub: formatPercent(c.share) })) },
      p(`${top.name} responde por ${formatPercent(top.share)} das saídas.`),
      acts({ label: "Onde economizar?", ask: "Onde posso economizar?" }, { label: "Ver movimentações", to: "/movimentacoes" }),
      ...demoNote,
    ];
  }

  if (/reserva|meta|guardar|objetivo|poupar|completar/.test(x)) {
    const active = data.goals.filter((g) => g.status === "active");
    const g = active.find((i) => /reserva/.test(norm(i.title))) ?? active[0];
    if (!g) return [p("Você ainda não criou nenhuma meta."), acts({ label: "Criar meta", to: "/metas" })];
    const saved = toNumber(g.current_amount);
    const target = toNumber(g.target_amount);
    const rem = Math.max(0, target - saved);
    if (rem <= 0) return [p("Sua meta ", b(g.title), " já está completa, com ", b(m(saved)), "."), acts({ label: "Ver metas", to: "/metas" })];
    const out: Block[] = [
      p("Sua meta ", b(g.title), ` está em ${formatPercent(goalProgress(g))}: `, b(m(saved)), " de ", b(m(target)), ". Faltam ", b(m(rem)), "."),
    ];
    if (cur.income > 0) {
      const ap = Math.max(100, Math.round((cur.income * 0.1) / 50) * 50);
      const months = Math.ceil(rem / ap);
      out.push(p("Separando ", b(m(ap)), " por mês, cerca de 10% do que entrou neste mês, você completa em ", b(`${months} ${plural(months, "mês", "meses")}`), "."));
    }
    out.push(acts({ label: "Ver metas", to: "/metas" }), ...demoNote);
    return out;
  }

  if (/mes|resultado|resumo|balanco|como foi/.test(x)) {
    const prev = monthSummary(data.transactions, prevMonth(ref));
    const signed = `${cur.result < 0 ? "−" : "+"} ${m(Math.abs(cur.result))}`;
    const out: Block[] = [p("Neste mês entraram ", b(m(cur.income)), " e saíram ", b(m(cur.expenses)), ". O resultado é ", b(signed), ".")];
    if (cur.result >= 0 && cur.income > 0) out.push(p(`Você ficou com ${formatPercent(cur.result / cur.income)} do que recebeu.`));
    if (cur.result < 0) out.push(p("As saídas passaram das entradas. Vale olhar as maiores categorias."));
    if (prev.expenses > 0 && prev.count >= 3) {
      const diff = (cur.expenses - prev.expenses) / prev.expenses;
      out.push(p(`Em relação ao mês anterior, as saídas ${diff >= 0 ? "subiram" : "caíram"} ${formatPercent(Math.abs(diff))} até agora.`));
    }
    out.push(acts({ label: "Onde gastei mais?", ask: "Onde estou gastando mais?" }, { label: "Ver movimentações", to: "/movimentacoes" }), ...demoNote);
    return out;
  }

  if (/conta|banco|conect|open finance|instituic|saldo|patrimonio/.test(x)) {
    const pos = financialPosition(data.accounts, data.investments, data.invoices, data.cards);
    const n = data.accounts.length;
    return [
      p("Você tem ", b(`${n} ${plural(n, "conta", "contas")}`), " com ", b(m(pos.availableCash)), " de saldo, mais ", b(m(pos.investmentsTotal)), " investidos."),
      p("Para somar outro banco, a autorização acontece no ambiente dele. A Kallan nunca pede sua senha."),
      acts({ label: "Conectar instituição", to: "/open-finance" }, { label: "Ver carteira", to: "/carteira" }),
      ...demoNote,
    ];
  }

  return [
    p("Ainda não sei responder isso. Por enquanto eu cuido destes assuntos:"),
    acts(
      { label: "Meus gastos", ask: "Onde estou gastando mais?" },
      { label: "Meu mês", ask: "Como foi meu mês?" },
      { label: "Vencimentos", ask: "O que vence nos próximos dias?" },
      { label: "Minhas metas", ask: "Como estão minhas metas?" },
    ),
  ];
}
