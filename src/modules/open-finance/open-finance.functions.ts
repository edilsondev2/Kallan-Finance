import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { OpenFinanceInstitution } from './provider';

const PRODUCT_LABELS: Record<string, string> = { ACCOUNTS: 'Contas', TRANSACTIONS: 'Movimentações', CREDIT_CARDS: 'Cartões', INVESTMENTS: 'Investimentos', IDENTITY: 'Dados cadastrais', LOANS: 'Empréstimos' };

export const listOpenFinanceInstitutions = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async (): Promise<OpenFinanceInstitution[]> => {
  const { malvo } = await import('./malvo.server');
  const out: OpenFinanceInstitution[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await malvo<{ results: import('./malvo.server').MalvoConnector[]; totalPages: number }>(`/connectors?isOpenFinance=true&countries=BR&page=${page}`);
    for (const c of res.results) out.push({ id: String(c.id), name: c.name, imageUrl: c.imageUrl ?? null, sandbox: !!c.isSandbox, products: (c.products ?? []).map((p) => PRODUCT_LABELS[p] ?? p) });
    if (page >= res.totalPages) break;
  }
  return out;
});

export const createConnectToken = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ returnUrl: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { malvo } = await import('./malvo.server');
    const redirect = new URL(data.returnUrl);
    const options: Record<string, unknown> = { clientUserId: context.userId, avoidDuplicates: true };
    // Malvo rejects http:// and localhost redirect URIs; the popup flow still works without one.
    if (redirect.protocol === 'https:' && redirect.hostname !== 'localhost') options['oauthRedirectUri'] = `${redirect.origin}/open-finance`;
    const res = await malvo<{ accessToken: string }>('/connect_token', { method: 'POST', body: { options } });
    return { connectToken: res.accessToken };
  });

const uuid = z.string().uuid();

/** Records an item the user just authorized. Trusts only what the provider returns for it. */
export const registerConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ itemId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { malvo, mapItemStatus } = await import('./malvo.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const item = await malvo<import('./malvo.server').MalvoItem>(`/items/${data.itemId}`);
    if (item.clientUserId !== context.userId) throw new Error('Conexão não pertence a esta conta.');
    const status = mapItemStatus(item);
    const { data: row, error } = await supabaseAdmin
      .from('of_connections')
      .upsert({ user_id: context.userId, provider: 'malvo', provider_item_id: item.id, institution_name: item.connector.name, status, status_detail: item.executionStatus ?? null, last_sync_at: item.lastUpdatedAt ?? null }, { onConflict: 'provider,provider_item_id' })
      .select('id, status')
      .single();
    if (error) { console.error('[open-finance] save connection failed', error.code); throw new Error('Não foi possível salvar a conexão.'); }
    return row;
  });

export const refreshConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ connectionId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { malvo, mapItemStatus, MalvoError } = await import('./malvo.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: conn } = await supabaseAdmin.from('of_connections').select('id, provider_item_id').eq('id', data.connectionId).eq('user_id', context.userId).eq('provider', 'malvo').maybeSingle();
    if (!conn?.provider_item_id) throw new Error('Conexão não encontrada.');
    let patch: { status: 'revoked' | ReturnType<typeof mapItemStatus>; status_detail: string | null; last_sync_at?: string | null };
    try {
      const item = await malvo<import('./malvo.server').MalvoItem>(`/items/${conn.provider_item_id}`);
      patch = { status: mapItemStatus(item), status_detail: item.executionStatus ?? null, last_sync_at: item.lastUpdatedAt ?? null };
    } catch (e) {
      if (e instanceof MalvoError && e.status === 404) patch = { status: 'revoked', status_detail: 'ITEM_NOT_FOUND' };
      else throw new Error('Não foi possível consultar o provedor.');
    }
    await supabaseAdmin.from('of_connections').update(patch).eq('id', conn.id);
    return { status: patch.status };
  });

export const revokeConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ connectionId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { malvo, MalvoError } = await import('./malvo.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: conn } = await supabaseAdmin.from('of_connections').select('id, provider_item_id').eq('id', data.connectionId).eq('user_id', context.userId).eq('provider', 'malvo').maybeSingle();
    if (!conn?.provider_item_id) throw new Error('Conexão não encontrada.');
    try { await malvo(`/items/${conn.provider_item_id}`, { method: 'DELETE' }); }
    catch (e) { if (!(e instanceof MalvoError && e.status === 404)) throw new Error('Não foi possível revogar no provedor.'); }
    await supabaseAdmin.from('of_connections').update({ status: 'revoked', status_detail: 'REVOKED_BY_USER' }).eq('id', conn.id);
    return { ok: true };
  });

export const listMyConnections = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('of_connections').select('id, institution_name, status, status_detail, last_sync_at, created_at').order('created_at', { ascending: false });
  if (error) throw new Error('Não foi possível carregar suas conexões.');
  return data ?? [];
});
