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
export class MalvoProvider implements OpenFinanceProvider {
  async listInstitutions(): Promise<OpenFinanceInstitution[]> {
    const out: OpenFinanceInstitution[] = [];
    for (let page = 1; ; page++) {
      const result = await malvo<{ results: MalvoConnector[]; totalPages: number }>(`/connectors?isOpenFinance=true&countries=BR&page=${page}`);
      for (const c of result.results) {
        const products = (c.products ?? []).map(p => PRODUCT_LABELS[p] ?? p);
        if (isRealInstitution(c)) out.push({ id: String(c.id), name: c.name, sandbox: false, products });
        else if (sandboxAllowed() && isTestInstitution(c)) out.push({ id: String(c.id), name: c.name, sandbox: true, products });
      }
      if (page >= result.totalPages) break;
    }
    return out.sort((a, b) => Number(a.sandbox) - Number(b.sandbox));
  }
  async createConnectToken(userId: string) {
    const res = await malvo<{ accessToken: string }>('/connect_token', { method: 'POST', body: { options: { clientUserId: userId, avoidDuplicates: true } } });
    return { connectToken: res.accessToken };
  }
  getItem(id: string) { return malvo<ProviderItem>(`/items/${id}`); }
  async revokeConsent(id: string) { await malvo(`/items/${id}`, { method: 'DELETE' }); }
}
