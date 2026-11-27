import type { Database } from '@/integrations/supabase/types';

/** Pure mapping from Malvo payloads (https://docs.malvo.io) to Kallan rows. No I/O, so it can be tested. */
type Tables = Database['public']['Tables'];
export type AccountRow = Tables['accounts']['Insert'];
export type CardRow = Tables['credit_cards']['Insert'];
export type InvoiceRow = Tables['card_invoices']['Insert'];
export type InvestmentRow = Tables['investments']['Insert'];
export type TransactionRow = Tables['transactions']['Insert'];

export interface MalvoCreditData { brand?: string | null; balanceCloseDate?: string | null; balanceDueDate?: string | null; availableCreditLimit?: number | null; creditLimit?: number | null; minimumPayment?: number | null }
export interface MalvoAccount { id: string; type?: string | null; subtype?: string | null; number?: string | null; name?: string | null; marketingName?: string | null; balance?: number | null; balanceUpdatedAt?: string | null; currencyCode?: string | null; creditData?: MalvoCreditData | null }
export interface MalvoBill { id: string; dueDate?: string | null; totalAmount?: number | null; financeCharges?: { amount?: number | null }[] | null; payments?: { amount?: number | null }[] | null }
export interface MalvoTransaction { id: string; description?: string | null; amount?: number | null; date?: string | null; type?: string | null; status?: string | null; accountId?: string | null }
export interface MalvoInvestment { id: string; name?: string | null; type?: string | null; balance?: number | null; amount?: number | null; amountOriginal?: number | null; date?: string | null; issuer?: string | null }

export interface Ctx { userId: string; connectionId: string; institution: string; now: Date }

const round2 = (n: number) => Math.round(n * 100) / 100;
/** Malvo sends amounts as decimals in reais (docs: "Amount units"). Anything unusable becomes 0. */
export const money = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? round2(n) : 0);
const clip = (s: string | null | undefined, max: number, fallback: string) => ((s ?? '').trim() || fallback).slice(0, max);
const dateOnly = (iso: string | null | undefined, fallback: Date) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : fallback.toISOString().slice(0, 10));
const dayOf = (iso: string | null | undefined) => {
  const d = iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? Number(iso.slice(8, 10)) : NaN;
  return d >= 1 && d <= 31 ? d : null;
};

export function isCardAccount(a: Pick<MalvoAccount, 'type' | 'subtype'>) {
  return a.type === 'CREDIT' || a.subtype === 'CREDIT_CARD';
}

export function mapBankAccount(a: MalvoAccount, c: Ctx): AccountRow {
  return {
    user_id: c.userId, connection_id: c.connectionId, source: 'open_finance', external_id: a.id,
    type: a.subtype === 'CHECKING_ACCOUNT' ? 'checking' : a.subtype === 'SAVINGS_ACCOUNT' ? 'savings' : 'other',
    name: clip(a.marketingName || a.name, 80, 'Conta'), institution_name: clip(c.institution, 80, 'Instituição'),
    balance: money(a.balance), currency: a.currencyCode || 'BRL',
    balance_updated_at: a.balanceUpdatedAt || c.now.toISOString(),
  };
}

export function mapCard(a: MalvoAccount, c: Ctx): CardRow {
  const cd = a.creditData ?? {};
  const last = /(\d{4})\D*$/.exec(a.number ?? '');
  return {
    user_id: c.userId, connection_id: c.connectionId, source: 'open_finance', external_id: a.id,
    name: clip(a.marketingName || a.name, 80, 'Cartão de crédito'), institution_name: clip(c.institution, 80, 'Instituição'),
    brand: cd.brand ?? null, last_four: last?.[1] ?? null,
    credit_limit: cd.creditLimit == null ? null : money(cd.creditLimit), available_limit: cd.availableCreditLimit == null ? null : money(cd.availableCreditLimit),
    closing_day: dayOf(cd.balanceCloseDate), due_day: dayOf(cd.balanceDueDate),
  };
}

const firstOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`;

/** Closed bills from /bills plus the currently open invoice (the card account's balance, per the docs). */
export function mapInvoices(card: MalvoAccount, bills: MalvoBill[], cardId: string, c: Ctx): InvoiceRow[] {
  const today = c.now.toISOString().slice(0, 10);
  const sorted = [...bills].filter(b => b.dueDate && /^\d{4}-\d{2}-\d{2}/.test(b.dueDate)).sort((x, y) => (x.dueDate ?? '').localeCompare(y.dueDate ?? ''));
  const sum = (xs: { amount?: number | null }[] | null | undefined) => (xs ?? []).reduce((t, x) => t + money(x.amount), 0);
  const rows: InvoiceRow[] = sorted.map((b, i) => {
    const total = money(b.totalAmount);
    const next = sorted[i + 1];
    // Docs: bill N is settled when the payments listed on bill N+1 cover totalAmount(N) + financeCharges(N+1).
    const settled = !!next && total > 0 && sum(next.payments) + 0.005 >= total + sum(next.financeCharges);
    const due = (b.dueDate ?? '').slice(0, 10);
    return {
      user_id: c.userId, card_id: cardId, source: 'open_finance', external_id: b.id,
      reference_month: firstOfMonth(due), due_date: due, amount: total,
      status: settled ? 'paid' : due < today ? 'overdue' : 'closed',
    };
  });
  const cd = card.creditData ?? {};
  const open = money(card.balance);
  if (open > 0 && cd.balanceDueDate && /^\d{4}-\d{2}-\d{2}/.test(cd.balanceDueDate)) {
    rows.push({ user_id: c.userId, card_id: cardId, source: 'open_finance', external_id: `${card.id}:open`, reference_month: firstOfMonth(cd.balanceDueDate), due_date: cd.balanceDueDate.slice(0, 10), amount: open, status: 'open' });
  }
  return rows;
}

const PAYS_CARD = /pag(amento|to)?.*fatura|fatura.*cart/i;

/**
 * Sign rules from the docs: bank accounts debit = negative, credit = positive; cards are inverted
 * (purchase positive DEBIT, payment/refund negative CREDIT). We rely on `type` and store a positive amount.
 */
export function mapTransaction(t: MalvoTransaction, target: { kind: 'bank' | 'card'; ourId: string }, c: Ctx): TransactionRow | null {
  const amount = Math.abs(money(t.amount));
  if (amount === 0) return null;
  const isIn = t.type === 'CREDIT' ? true : t.type === 'DEBIT' ? false : money(t.amount) > 0 && target.kind === 'bank';
  const description = clip(t.description, 140, 'Movimentação');
  const type: TransactionRow['type'] = target.kind === 'card' ? (isIn ? 'payment' : 'card_purchase') : isIn ? 'income' : PAYS_CARD.test(description) ? 'payment' : 'expense';
  return {
    user_id: c.userId, source: 'open_finance', external_id: t.id,
    account_id: target.kind === 'bank' ? target.ourId : null, card_id: target.kind === 'card' ? target.ourId : null,
    occurred_on: dateOnly(t.date, c.now), description, amount, direction: isIn ? 'in' : 'out', type,
    institution_name: clip(c.institution, 80, 'Instituição'),
  };
}

const KIND: Record<string, string> = { FIXED_INCOME: 'renda_fixa', EQUITY: 'acoes', ETF: 'etf', MUTUAL_FUND: 'fundos', COE: 'coe', SECURITY: 'titulos', OTHER: 'outro' };

export function mapInvestment(i: MalvoInvestment, c: Ctx): InvestmentRow {
  return {
    user_id: c.userId, connection_id: c.connectionId, source: 'open_finance', external_id: i.id,
    name: clip(i.name, 80, 'Investimento'), kind: KIND[i.type ?? ''] ?? 'outro', institution_name: clip(c.institution, 80, 'Instituição'),
    amount: money(i.balance ?? i.amount), invested_amount: i.amountOriginal == null ? null : money(i.amountOriginal),
    position_date: dateOnly(i.date, c.now),
  };
}
