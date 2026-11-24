/**
 * Deterministic financial rules. The AI only interprets these results — it never computes values.
 * Key distinctions enforced here:
 *  - credit limit is NOT balance
 *  - an open invoice is NOT an overdue debt
 *  - net worth (patrimônio) is NOT available cash
 *  - investments are NOT account balance
 *  - transfers are neither income nor expense
 */
import { parseLocalDate, toNumber } from "@/lib/format";
import type { Account, BalanceSnapshot, CardInvoice, Category, CreditCard, FinanceData, Goal, Investment, Transaction } from "./types";

export type MonthKey = { year: number; month: number }; // month 0-11

export function monthKeyOf(d: Date): MonthKey {
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function prevMonth(k: MonthKey): MonthKey {
  return k.month === 0 ? { year: k.year - 1, month: 11 } : { year: k.year, month: k.month - 1 };
}

export function inMonth(dateStr: string, k: MonthKey): boolean {
  const d = parseLocalDate(dateStr);
  return d.getFullYear() === k.year && d.getMonth() === k.month;
}

/** Transfers between own accounts are excluded from income/expense. */
export function countsAsFlow(tx: Pick<Transaction, "type">): boolean {
  return tx.type !== "transfer";
}

export type MonthSummary = { income: number; expenses: number; result: number; count: number };

export function monthSummary(transactions: Transaction[], k: MonthKey): MonthSummary {
  let income = 0;
  let expenses = 0;
  let count = 0;
  for (const tx of transactions) {
    if (!inMonth(tx.occurred_on, k)) continue;
    count++;
    if (!countsAsFlow(tx)) continue;
    const amt = toNumber(tx.amount);
    if (tx.direction === "in") income += amt;
    else expenses += amt;
  }
  return { income: round2(income), expenses: round2(expenses), result: round2(income - expenses), count };
}

/** Relative change, or null when there is no base to compare against. */
export function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export type CategorySlice = { categoryId: string | null; name: string; icon: string; color: string; total: number; share: number; count: number };

export function categoryBreakdown(transactions: Transaction[], categories: Category[], k: MonthKey): CategorySlice[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const acc = new Map<string, CategorySlice>();
  let grand = 0;
  for (const tx of transactions) {
    if (tx.direction !== "out" || !countsAsFlow(tx) || !inMonth(tx.occurred_on, k)) continue;
    const amt = toNumber(tx.amount);
    grand += amt;
    const key = tx.category_id ?? "none";
    const cat = tx.category_id ? byId.get(tx.category_id) : undefined;
    const slot = acc.get(key) ?? {
      categoryId: tx.category_id,
      name: cat?.name ?? "Sem categoria",
      icon: cat?.icon ?? "circle",
      color: cat?.color ?? "slate",
      total: 0,
      share: 0,
      count: 0,
    };
    slot.total += amt;
    slot.count++;
    acc.set(key, slot);
  }
  return [...acc.values()]
    .map((s) => ({ ...s, total: round2(s.total), share: grand ? s.total / grand : 0 }))
    .sort((a, b) => b.total - a.total);
}

export type Position = {
  availableCash: number;
  investmentsTotal: number;
  openInvoices: number;
  overdueInvoices: number;
  obligations: number;
  assets: number;
  netWorth: number;
  creditLimitTotal: number;
  creditAvailableTotal: number;
  institutions: number;
};

export function financialPosition(
  accounts: Account[],
  investments: Investment[],
  invoices: CardInvoice[],
  cards: CreditCard[],
): Position {
  const availableCash = sum(accounts.map((a) => toNumber(a.balance)));
  const investmentsTotal = sum(investments.map((i) => toNumber(i.amount)));
  const openInvoices = sum(invoices.filter((i) => i.status === "open" || i.status === "closed").map((i) => toNumber(i.amount)));
  const overdueInvoices = sum(invoices.filter((i) => i.status === "overdue").map((i) => toNumber(i.amount)));
  const obligations = openInvoices + overdueInvoices;
  // Negative account balances (overdraft) are obligations already reflected in availableCash.
  const assets = sum(accounts.map((a) => Math.max(0, toNumber(a.balance)))) + investmentsTotal;
  const netWorth = availableCash + investmentsTotal - obligations;
  const institutions = new Set(
    [...accounts, ...cards, ...investments].map((x) => (x.institution_name ?? "").trim().toLowerCase()).filter(Boolean),
  ).size;
  return {
    availableCash: round2(availableCash),
    investmentsTotal: round2(investmentsTotal),
    openInvoices: round2(openInvoices),
    overdueInvoices: round2(overdueInvoices),
    obligations: round2(obligations),
    assets: round2(assets),
    netWorth: round2(netWorth),
    creditLimitTotal: round2(sum(cards.map((c) => toNumber(c.credit_limit)))),
    creditAvailableTotal: round2(sum(cards.map((c) => toNumber(c.available_limit)))),
    institutions,
  };
}

/** Cash balance change over `days`, using snapshots. Null when history is insufficient. */
export function cashVariation(snapshots: BalanceSnapshot[], accounts: Account[], days = 30, now = new Date()): { previous: number; current: number; change: number } | null {
  const cutoff = now.getTime() - days * 86400000;
  let previous = 0;
  let hasHistory = false;
  for (const acc of accounts) {
    const past = snapshots
      .filter((s) => s.account_id === acc.id && new Date(s.captured_at).getTime() <= cutoff)
      .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())[0];
    if (past) {
      hasHistory = true;
      previous += toNumber(past.balance);
    }
  }
  if (!hasHistory) return null;
  const current = sum(accounts.map((a) => toNumber(a.balance)));
  return { previous: round2(previous), current: round2(current), change: round2(current - previous) };
}

export function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0-9]+/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type Recurring = { key: string; label: string; months: number; averageAmount: number };

/** Expenses with the same normalized description in at least 2 of the last 3 months. */
export function recurringExpenses(transactions: Transaction[], ref: MonthKey): Recurring[] {
  const months = [ref, prevMonth(ref), prevMonth(prevMonth(ref))];
  const map = new Map<string, { label: string; months: Set<number>; total: number; n: number }>();
  for (const tx of transactions) {
    if (tx.direction !== "out" || !countsAsFlow(tx)) continue;
    const idx = months.findIndex((m) => inMonth(tx.occurred_on, m));
    if (idx < 0) continue;
    const key = normalizeDescription(tx.description);
    if (key.length < 3) continue;
    const e = map.get(key) ?? { label: tx.description, months: new Set<number>(), total: 0, n: 0 };
    e.months.add(idx);
    e.total += toNumber(tx.amount);
    e.n++;
    map.set(key, e);
  }
  return [...map.entries()]
    .filter(([, e]) => e.months.size >= 2)
    .map(([key, e]) => ({ key, label: e.label, months: e.months.size, averageAmount: round2(e.total / e.n) }))
    .sort((a, b) => b.averageAmount - a.averageAmount);
}

export type Insight = {
  id: string;
  tone: "positive" | "attention" | "neutral";
  title: string;
  explanation: string;
  link: { to: string; label: string };
};

export const MIN_TX_FOR_INSIGHTS = 3;

/** Generates insights only when the data supports them. */
export function generateInsights(data: Pick<FinanceData, "transactions" | "categories" | "goals">, ref: MonthKey): Insight[] {
  const out: Insight[] = [];
  const cur = monthSummary(data.transactions, ref);
  const prev = monthSummary(data.transactions, prevMonth(ref));
  const enough = cur.count >= MIN_TX_FOR_INSIGHTS && prev.count >= MIN_TX_FOR_INSIGHTS;

  if (enough) {
    const curCats = categoryBreakdown(data.transactions, data.categories, ref);
    const prevCats = categoryBreakdown(data.transactions, data.categories, prevMonth(ref));
    const prevById = new Map(prevCats.map((c) => [c.categoryId ?? "none", c.total]));
    const grew = curCats
      .map((c) => ({ c, before: prevById.get(c.categoryId ?? "none") ?? 0 }))
      .filter(({ c, before }) => before > 0 && c.total - before >= 50 && (c.total - before) / before >= 0.2)
      .sort((a, b) => b.c.total - b.before - (a.c.total - a.before))[0];
    if (grew) {
      out.push({
        id: `cat-up-${grew.c.categoryId}`,
        tone: "attention",
        title: `Você gastou mais com ${grew.c.name.toLowerCase()} este mês`,
        explanation: `Os gastos nessa categoria subiram ${Math.round(((grew.c.total - grew.before) / grew.before) * 100)}% em relação ao mês anterior, com base nas movimentações registradas.`,
        link: { to: "/movimentacoes", label: "Ver movimentações" },
      });
    }
    if (prev.expenses > 0 && cur.expenses < prev.expenses * 0.95) {
      out.push({
        id: "expenses-down",
        tone: "positive",
        title: "Seus gastos diminuíram em comparação ao mês anterior",
        explanation: `As saídas do mês estão ${Math.round((1 - cur.expenses / prev.expenses) * 100)}% menores que no mês passado até agora.`,
        link: { to: "/movimentacoes", label: "Entender a diferença" },
      });
    }
    const rec = recurringExpenses(data.transactions, ref);
    const firstRecurring = rec[0];
    if (rec.length >= 2 && firstRecurring) {
      out.push({
        id: "recurring",
        tone: "neutral",
        title: `Identificamos ${rec.length} despesas que se repetem`,
        explanation: `Lançamentos como "${firstRecurring.label}" aparecem em vários meses. Revisar assinaturas e cobranças recorrentes ajuda a evitar gastos que passam despercebidos.`,
        link: { to: "/inteligencia", label: "Analisar recorrências" },
      });
    }
  }

  for (const g of data.goals) {
    if (g.status !== "active") continue;
    const ratio = toNumber(g.current_amount) / toNumber(g.target_amount);
    if (ratio >= 0.8 && ratio < 1) {
      out.push({
        id: `goal-${g.id}`,
        tone: "positive",
        title: `Você está próximo de atingir a meta "${g.title}"`,
        explanation: `Já foram acumulados ${Math.round(ratio * 100)}% do valor definido.`,
        link: { to: "/metas", label: "Ver meta" },
      });
      break;
    }
  }
  return out;
}

export type DataQuality = {
  hasData: boolean;
  transactionCount: number;
  manualCount: number;
  connectedCount: number;
  lastUpdate: string | null;
  missing: string[];
};

export function dataQuality(data: FinanceData): DataQuality {
  const all = [...data.accounts, ...data.cards, ...data.investments, ...data.transactions];
  const missing: string[] = [];
  if (!data.accounts.length) missing.push("contas e saldos");
  if (!data.transactions.length) missing.push("movimentações");
  if (!data.cards.length) missing.push("cartões e faturas");
  if (!data.investments.length) missing.push("investimentos");
  const dates = [
    ...data.accounts.map((a) => a.balance_updated_at),
    ...data.transactions.map((t) => t.created_at),
    ...data.investments.map((i) => i.updated_at),
  ].filter(Boolean);
  const last = dates.sort().at(-1) ?? null;
  return {
    hasData: all.length > 0,
    transactionCount: data.transactions.length,
    manualCount: all.filter((x) => x.source === "manual").length,
    connectedCount: all.filter((x) => x.source === "open_finance").length,
    lastUpdate: last,
    missing,
  };
}

export function goalProgress(g: Pick<Goal, "current_amount" | "target_amount">): number {
  const t = toNumber(g.target_amount);
  return t > 0 ? Math.max(0, Math.min(1, toNumber(g.current_amount) / t)) : 0;
}

/** Last N months income/expense series ending at ref (oldest first). */
export function monthlySeries(transactions: Transaction[], ref: MonthKey, n = 6) {
  const keys: MonthKey[] = [];
  let k = ref;
  for (let i = 0; i < n; i++) {
    keys.unshift(k);
    k = prevMonth(k);
  }
  return keys.map((key) => {
    const s = monthSummary(transactions, key);
    const label = new Date(key.year, key.month, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    return { label, ...s };
  });
}

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
