import { createServerOnlyFn } from '@tanstack/react-start';
import type { OpenFinanceProvider, OpenFinanceInstitution, ProviderItem } from './provider';
import { isRealInstitution, isTestInstitution } from './calculations';
/**
 * Malvo REST client (server only). Contract from https://docs.malvo.io:
 * POST /auth {clientId, clientSecret} -> apiKey (2h); other calls send X-API-KEY.
 * Credentials live in the project secrets `Malvo` (clientId) and `Malvo2` (clientSecret).
 */
const BASE = 'https://api.malvo.io';
let cached: { key: string; expires: number } | null = null;

const credentials = createServerOnlyFn(() => {
  const clientId = process.env['Malvo']?.trim();
  const clientSecret = process.env['Malvo2']?.trim();
  if (!clientId || !clientSecret) throw new Error('Credenciais do Open Finance não configuradas.');
  return { clientId, clientSecret };
});

async function apiKey(force = false): Promise<string> {
  if (!force && cached && cached.expires > Date.now()) return cached.key;
  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'KallanFinance/1.0' },
    body: JSON.stringify(credentials()),
  });
  if (!res.ok) {
    console.error('[malvo] auth failed', res.status);
    throw new Error('Não foi possível autenticar no provedor de Open Finance.');
  }
  const body = (await res.json()) as { apiKey?: string };
  if (!body.apiKey) throw new Error('Resposta inválida do provedor de Open Finance.');
  cached = { key: body.apiKey, expires: Date.now() + 100 * 60_000 };
  return body.apiKey;
}

/** Test mode: set the server secret OPEN_FINANCE_SANDBOX=true to list Malvo's sandbox institutions. Off by default. */
export const sandboxAllowed = () => process.env['OPEN_FINANCE_SANDBOX']?.trim() === 'true';

export class MalvoError extends Error {
  constructor(public status: number, public code: string | undefined) {
    super(`Malvo ${status}${code ? ` ${code}` : ''}`);
  }
}

export async function malvo<T>(path: string, init: { method?: string; body?: unknown } = {}, retried = false): Promise<T> {
  const key = await apiKey(retried);
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: { 'X-API-KEY': key, Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'KallanFinance/1.0' },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  // Auth failures may come back as 401 or 403 (connect_token): renew the apiKey once.
  if ((res.status === 401 || res.status === 403) && !retried) return malvo<T>(path, init, true);
  if (!res.ok) {
    let code: string | undefined;
    try { code = ((await res.json()) as { codeDescription?: string }).codeDescription; } catch { /* no body */ }
    console.error('[malvo] request failed', init.method ?? 'GET', res.status);
    throw new MalvoError(res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface MalvoConnector { id: number; name: string; imageUrl?: string | null; products?: string[]; isSandbox?: boolean; isOpenFinance?: boolean; type?: string; country?: string; health?: { status?: string } | null }

const PRODUCT_LABELS: Record<string, string> = { ACCOUNTS: 'Contas', TRANSACTIONS: 'Movimentações', CREDIT_CARDS: 'Cartões', INVESTMENTS: 'Investimentos', IDENTITY: 'Dados cadastrais', LOANS: 'Empréstimos' };
const SANDBOX_QUERIES = [
  { label: 'teste: includeSandbox', q: 'includeSandbox=true' },
  { label: 'teste: sandbox', q: 'sandbox=true' },
  { label: 'teste: sem filtros', q: '' },
] as const;

async function fetchConnectors(query: string, maxPages = 10): Promise<MalvoConnector[]> {
  const all: MalvoConnector[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const result = await malvo<{ results: MalvoConnector[]; totalPages: number }>(`/connectors?${query ? `${query}&` : ''}page=${page}`);
    all.push(...result.results);
    if (page >= result.totalPages) break;
  }
  return all;
}

export interface OpenFinanceProbe { label: string; ok: boolean; total?: number; sandbox?: number; sample?: string[]; error?: string }

/** What Malvo answers to each listing variant. No secrets: only counts, a few connector names and a short error. */
export async function probeConnectors(): Promise<OpenFinanceProbe[]> {
  const variants = [{ label: 'reais: isOpenFinance + BR', q: 'isOpenFinance=true&countries=BR' }, ...SANDBOX_QUERIES];
  const out: OpenFinanceProbe[] = [];
  for (const v of variants) {
    try {
      const list = await fetchConnectors(v.q, 3);
      out.push({ label: v.label, ok: true, total: list.length, sandbox: list.filter(c => c.isSandbox === true).length, sample: list.slice(0, 4).map(c => c.name) });
    } catch (e) {
      out.push({ label: v.label, ok: false, error: e instanceof MalvoError ? `HTTP ${e.status}${e.code ? ` ${e.code}` : ''}` : e instanceof Error ? e.message : 'erro' });
    }
  }
  return out;
}

/** Only https logos are passed to the browser. */
const img = (c: MalvoConnector): { imageUrl?: string } => (typeof c.imageUrl === 'string' && c.imageUrl.startsWith('https://') ? { imageUrl: c.imageUrl } : {});

export class MalvoProvider implements OpenFinanceProvider {
  async listInstitutions(): Promise<OpenFinanceInstitution[]> {
    const toProducts = (c: MalvoConnector) => (c.products ?? []).map(p => PRODUCT_LABELS[p] ?? p);
    const out: OpenFinanceInstitution[] = [];
    try {
      for (const c of await fetchConnectors('isOpenFinance=true&countries=BR')) {
        if (isRealInstitution(c)) out.push({ id: String(c.id), name: c.name, sandbox: false, products: toProducts(c), ...img(c) });
      }
    } catch (e) {
      if (!sandboxAllowed()) throw e; // in test mode a failing real listing must not hide the test institutions
    }
    if (!sandboxAllowed()) return out;

    // Test mode. Malvo hides sandbox connectors unless the request opts in (docs: GET /connectors `sandbox` / `includeSandbox`);
    // the docs do not say which one wins, and a SANDBOX application only sees sandbox connectors, so try each until one returns some.
    const tests = new Map<number, MalvoConnector>();
    for (const query of SANDBOX_QUERIES) {
      try {
        for (const c of await fetchConnectors(query.q)) if (isTestInstitution(c)) tests.set(c.id, c);
      } catch {
        // try the next variant; the failure is logged by malvo()
      }
      if (tests.size) break;
    }
    const sorted = [...tests.values()].sort((x, y) => Number(y.country === 'BR') - Number(x.country === 'BR'));
    return [...out, ...sorted.map(c => ({ id: String(c.id), name: c.name, sandbox: true, products: toProducts(c), ...img(c) }))];
  }
  async createConnectToken(userId: string, returnUrl?: string) {
    const base = { clientUserId: userId, avoidDuplicates: true };
    // oauthRedirectUri brings the user back to the app (with itemId and status in the URL) when the authorization finishes in a separate
    // browser window and the widget callbacks never reach the app. If Malvo rejects it, fall back to the callbacks only.
    if (returnUrl) {
      try {
        const res = await malvo<{ accessToken: string }>('/connect_token', { method: 'POST', body: { options: { ...base, oauthRedirectUri: returnUrl } } });
        return { connectToken: res.accessToken };
      } catch (e) {
        if (!(e instanceof MalvoError) || e.status >= 500) throw e;
      }
    }
    const res = await malvo<{ accessToken: string }>('/connect_token', { method: 'POST', body: { options: base } });
    return { connectToken: res.accessToken };
  }
  getItem(id: string) { return malvo<ProviderItem>(`/items/${id}`); }
  async revokeConsent(id: string) { await malvo(`/items/${id}`, { method: 'DELETE' }); }
}
