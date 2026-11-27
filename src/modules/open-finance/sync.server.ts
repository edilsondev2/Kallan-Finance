import { malvo, MalvoError } from './malvo.server';
import type { ProviderItem } from './provider';
import { isCardAccount, mapBankAccount, mapCard, mapInvestment, mapInvoices, mapTransaction, type Ctx, type MalvoAccount, type MalvoBill, type MalvoInvestment, type MalvoTransaction } from './sync';

/** Reads an item's data from Malvo and stores it as `open_finance` rows. Server only; uses the service role. */
export interface ConnectionRef { id: string; user_id: string; provider: string; provider_item_id: string; institution_name: string }
export interface SyncSummary { accounts: number; cards: number; invoices: number; investments: number; transactions: number; warnings: string[] }

const ON_CONFLICT = 'user_id,source,external_id';
export const isTestConnection = (c: Pick<ConnectionRef, 'provider'>) => c.provider === 'malvo_sandbox';

const isConsentTerminated = (e: unknown) => e instanceof MalvoError && e.code === 'ITEM_CONSENT_TERMINATED';
const describe = (e: unknown) => (e instanceof MalvoError ? `HTTP ${e.status}${e.code ? ` ${e.code}` : ''}` : 'falha');

/** Walks Malvo's `{ page, totalPages, results }` envelope. */
async function pages<T>(path: string, max = 20): Promise<T[]> {
  const all: T[] = [];
  const sep = path.includes('?') ? '&' : '?';
  for (let page = 1; page <= max; page++) {
    const r = await malvo<{ results?: T[]; totalPages?: number }>(`${path}${sep}page=${page}`);
    all.push(...(r.results ?? []));
    if (page >= (r.totalPages ?? 1)) break;
  }
  return all;
}

/** GET /v2/transactions is cursor based: follow `next` (its `after` value is opaque) until it is null. */
export async function transactionsOf(accountId: string, max = 20): Promise<MalvoTransaction[]> {
  const all: MalvoTransaction[] = [];
  let after: string | null = null;
  for (let i = 0; i < max; i++) {
    const r: { results?: MalvoTransaction[]; next?: string | null } = await malvo(`/v2/transactions?accountId=${accountId}${after ? `&after=${encodeURIComponent(after)}` : ''}`);
    all.push(...(r.results ?? []));
    if (!r.next) break;
    after = new URLSearchParams(r.next.includes('?') ? r.next.slice(r.next.indexOf('?') + 1) : r.next).get('after');
    if (!after) break;
  }
  return all;
}

const ctxOf = (conn: ConnectionRef): Ctx => ({ userId: conn.user_id, connectionId: conn.id, institution: isTestConnection(conn) ? `${conn.institution_name} (teste)` : conn.institution_name, now: new Date() });

export async function syncConnection(conn: ConnectionRef): Promise<SyncSummary> {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const ctx = ctxOf(conn);
  const sum: SyncSummary = { accounts: 0, cards: 0, invoices: 0, investments: 0, transactions: 0, warnings: [] };
  /** A failing part is reported as a warning; a terminated consent stops everything so it is never mistaken for "no data". */
  const guard = async <T>(label: string, fn: () => Promise<T>): Promise<T | undefined> => {
    try { return await fn(); } catch (e) {
      if (isConsentTerminated(e)) throw e;
      sum.warnings.push(`${label}: ${describe(e)}`);
      return undefined;
    }
  };
  const save = (what: string, error: { code?: string } | null) => {
    if (error) { console.error('[open-finance] sync save failed', what, error.code); throw new Error(`Não foi possível salvar ${what}.`); }
  };

  const accounts = (await guard('contas', () => pages<MalvoAccount>(`/accounts?itemId=${conn.provider_item_id}`))) ?? [];
  const targets = new Map<string, { kind: 'bank' | 'card'; ourId: string }>();

  const bank = accounts.filter(a => !isCardAccount(a));
  if (bank.length) {
    const { data, error } = await db.from('accounts').upsert(bank.map(a => mapBankAccount(a, ctx)), { onConflict: ON_CONFLICT }).select('id, external_id');
    save('as contas', error);
    for (const r of data ?? []) if (r.external_id) targets.set(r.external_id, { kind: 'bank', ourId: r.id });
    sum.accounts = data?.length ?? 0;
  }

  const cards = accounts.filter(isCardAccount);
  if (cards.length) {
    const { data, error } = await db.from('credit_cards').upsert(cards.map(a => mapCard(a, ctx)), { onConflict: ON_CONFLICT }).select('id, external_id');
    save('os cartões', error);
    for (const r of data ?? []) if (r.external_id) targets.set(r.external_id, { kind: 'card', ourId: r.id });
    sum.cards = data?.length ?? 0;
    for (const card of cards) {
      const ourId = targets.get(card.id)?.ourId;
      if (!ourId) continue;
      const bills = (await guard('faturas', () => pages<MalvoBill>(`/bills?accountId=${card.id}`))) ?? [];
      const rows = mapInvoices(card, bills, ourId, ctx);
      if (!rows.length) continue;
      const res = await db.from('card_invoices').upsert(rows, { onConflict: ON_CONFLICT });
      save('as faturas', res.error);
      sum.invoices += rows.length;
    }
  }

  for (const a of accounts) {
    const target = targets.get(a.id);
    if (!target) continue;
    const txs = await guard('movimentações', () => transactionsOf(a.id));
    const rows = (txs ?? []).map(t => mapTransaction(t, target, ctx)).filter((r): r is NonNullable<typeof r> => r !== null);
    for (let i = 0; i < rows.length; i += 500) {
      const res = await db.from('transactions').upsert(rows.slice(i, i + 500), { onConflict: ON_CONFLICT });
      save('as movimentações', res.error);
    }
    sum.transactions += rows.length;
  }

  const inv = await guard('investimentos', () => pages<MalvoInvestment>(`/investments?itemId=${conn.provider_item_id}&pageSize=500`));
  if (inv?.length) {
    const res = await db.from('investments').upsert(inv.map(i => mapInvestment(i, ctx)), { onConflict: ON_CONFLICT });
    save('os investimentos', res.error);
    sum.investments = inv.length;
  }

  await db.from('of_connections').update({ last_sync_at: ctx.now.toISOString() }).eq('id', conn.id).eq('user_id', conn.user_id);
  return sum;
}

/** Removes everything imported for a connection (used for test connections). */
export async function deleteConnectionData(conn: ConnectionRef): Promise<void> {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const [acc, crd] = await Promise.all([
    db.from('accounts').select('id').eq('connection_id', conn.id).eq('user_id', conn.user_id),
    db.from('credit_cards').select('id').eq('connection_id', conn.id).eq('user_id', conn.user_id),
  ]);
  const accountIds = (acc.data ?? []).map(r => r.id);
  const cardIds = (crd.data ?? []).map(r => r.id);
  if (accountIds.length) await db.from('transactions').delete().eq('user_id', conn.user_id).in('account_id', accountIds);
  if (cardIds.length) {
    await db.from('transactions').delete().eq('user_id', conn.user_id).in('card_id', cardIds);
    await db.from('card_invoices').delete().eq('user_id', conn.user_id).in('card_id', cardIds);
  }
  await db.from('investments').delete().eq('connection_id', conn.id).eq('user_id', conn.user_id);
  if (accountIds.length) await db.from('accounts').delete().eq('user_id', conn.user_id).in('id', accountIds);
  if (cardIds.length) await db.from('credit_cards').delete().eq('user_id', conn.user_id).in('id', cardIds);
}

export interface InspectAccount { kind: 'bank' | 'card'; name: string; type: string; subtype: string; number: string; currency: string; rawBalance: number | null; storedBalance: number | null; rawCreditLimit: number | null; storedCreditLimit: number | null; rawTransactions: number; storedTransactions: number; rawBills: number | null; storedInvoices: number | null }
export interface InspectInvestment { name: string; type: string; rawBalance: number | null; storedAmount: number | null }
export interface InspectResult { item: { status: string; executionStatus: string | null; lastUpdatedAt: string | null; connector: string; test: boolean }; accounts: InspectAccount[]; investments: InspectInvestment[]; warnings: string[] }

/** Fetches the item again from Malvo and sets what it says next to what Kallan stored, so differences are visible. */
export async function inspectConnection(conn: ConnectionRef): Promise<InspectResult> {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const warnings: string[] = [];
  const item = await malvo<ProviderItem>(`/items/${conn.provider_item_id}`);
  const accounts = await pages<MalvoAccount>(`/accounts?itemId=${conn.provider_item_id}`);
  const outAccounts: InspectAccount[] = [];
  for (const a of accounts) {
    const card = isCardAccount(a);
    let rawTransactions = 0;
    let rawBills: number | null = null;
    try { rawTransactions = (await transactionsOf(a.id)).length; } catch (e) { warnings.push(`movimentações de ${a.name ?? a.id}: ${describe(e)}`); }
    if (card) { try { rawBills = (await pages<MalvoBill>(`/bills?accountId=${a.id}`)).length; } catch (e) { warnings.push(`faturas de ${a.name ?? a.id}: ${describe(e)}`); } }
    let storedBalance: number | null = null;
    let storedCreditLimit: number | null = null;
    let storedTransactions = 0;
    let storedInvoices: number | null = null;
    if (card) {
      const { data } = await db.from('credit_cards').select('id, credit_limit').eq('user_id', conn.user_id).eq('source', 'open_finance').eq('external_id', a.id).maybeSingle();
      storedCreditLimit = data?.credit_limit == null ? null : Number(data.credit_limit);
      if (data) {
        storedTransactions = (await db.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', conn.user_id).eq('card_id', data.id)).count ?? 0;
        storedInvoices = (await db.from('card_invoices').select('id', { count: 'exact', head: true }).eq('user_id', conn.user_id).eq('card_id', data.id)).count ?? 0;
      }
    } else {
      const { data } = await db.from('accounts').select('id, balance').eq('user_id', conn.user_id).eq('source', 'open_finance').eq('external_id', a.id).maybeSingle();
      storedBalance = data ? Number(data.balance) : null;
      if (data) storedTransactions = (await db.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', conn.user_id).eq('account_id', data.id)).count ?? 0;
    }
    outAccounts.push({
      kind: card ? 'card' : 'bank', name: a.marketingName || a.name || 'Conta', type: a.type ?? '', subtype: a.subtype ?? '', number: a.number ?? '', currency: a.currencyCode ?? 'BRL',
      rawBalance: a.balance ?? null, storedBalance, rawCreditLimit: a.creditData?.creditLimit ?? null, storedCreditLimit, rawTransactions, storedTransactions, rawBills, storedInvoices,
    });
  }
  const outInv: InspectInvestment[] = [];
  try {
    for (const i of await pages<MalvoInvestment>(`/investments?itemId=${conn.provider_item_id}&pageSize=500`)) {
      const { data } = await db.from('investments').select('amount').eq('user_id', conn.user_id).eq('source', 'open_finance').eq('external_id', i.id).maybeSingle();
      outInv.push({ name: i.name ?? 'Investimento', type: i.type ?? '', rawBalance: i.balance ?? i.amount ?? null, storedAmount: data ? Number(data.amount) : null });
    }
  } catch (e) { warnings.push(`investimentos: ${describe(e)}`); }
  return { item: { status: item.status, executionStatus: item.executionStatus ?? null, lastUpdatedAt: item.lastUpdatedAt ?? null, connector: item.connector.name, test: isTestConnection(conn) }, accounts: outAccounts, investments: outInv, warnings };
}
