/**
 * Malvo REST client (server only). Contract from https://docs.malvo.io:
 * POST /auth {clientId, clientSecret} -> apiKey (2h); other calls send X-API-KEY.
 * Credentials live in the project secrets `Malvo` (clientId) and `Malvo2` (clientSecret).
 */
const BASE = 'https://api.malvo.io';
let cached: { key: string; expires: number } | null = null;

function credentials() {
  const clientId = process.env['Malvo']?.trim();
  const clientSecret = process.env['Malvo2']?.trim();
  if (!clientId || !clientSecret) throw new Error('Credenciais do Open Finance não configuradas.');
  return { clientId, clientSecret };
}

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
    console.error('[malvo] request failed', init.method ?? 'GET', path.split('?')[0], res.status, code);
    throw new MalvoError(res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface MalvoConnector { id: number; name: string; imageUrl?: string | null; products?: string[]; isSandbox?: boolean; isOpenFinance?: boolean; type?: string; country?: string; health?: { status?: string } | null }
export interface MalvoItem {
  id: string; status: string; executionStatus?: string | null; clientUserId?: string | null;
  connector: { id: number; name: string; isSandbox?: boolean };
  products?: string[]; lastUpdatedAt?: string | null; consentExpiresAt?: string | null;
}

type ConnectionStatus = 'preparing' | 'awaiting_authorization' | 'connecting' | 'syncing' | 'verifying' | 'completed' | 'failed' | 'consent_expired' | 'revoked';

/** Only an item the provider reports as UPDATED counts as a completed connection. */
export function mapItemStatus(item: Pick<MalvoItem, 'status' | 'executionStatus'>): ConnectionStatus {
  switch (item.status) {
    case 'UPDATED': return 'completed';
    case 'UPDATING': return 'syncing';
    case 'CREATING': case 'LOGIN_IN_PROGRESS': return 'connecting';
    case 'WAITING_USER_INPUT': return 'awaiting_authorization';
    case 'OUTDATED': return item.executionStatus === 'CONSENT_EXPIRED' || item.executionStatus === 'CONSENT_REVOKED' ? 'consent_expired' : 'failed';
    default: return 'failed';
  }
}
