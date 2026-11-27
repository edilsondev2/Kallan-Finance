import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { OpenFinanceInstitution } from './provider';
import { mapItemStatus, isOwnedRealItem, institutionExists } from './calculations';

export const listOpenFinanceInstitutions = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async (): Promise<OpenFinanceInstitution[]> => {
  const { MalvoProvider } = await import('./malvo.server');
  return new MalvoProvider().listInstitutions();
});

export const createConnectToken = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ institutionId: z.string().regex(/^\d+$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { MalvoProvider } = await import('./malvo.server');
    const provider = new MalvoProvider();
    const institutions = await provider.listInstitutions();
    if (!institutionExists(institutions, data.institutionId)) throw new Error('Esta instituição não está habilitada para conexões reais.');
    return provider.createConnectToken(context.userId);
  });

const uuid = z.string().uuid();

/** Records an item the user just authorized. Trusts only what the provider returns for it. */
export const registerConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ itemId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { MalvoProvider } = await import('./malvo.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const item = await new MalvoProvider().getItem(data.itemId);
    if (!isOwnedRealItem(item, context.userId)) throw new Error('Conexão não pertence a esta conta.');
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
    const { MalvoProvider, MalvoError } = await import('./malvo.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: conn } = await supabaseAdmin.from('of_connections').select('id, provider_item_id').eq('id', data.connectionId).eq('user_id', context.userId).eq('provider', 'malvo').maybeSingle();
    if (!conn?.provider_item_id) throw new Error('Conexão não encontrada.');
    let patch: { status: 'revoked' | ReturnType<typeof mapItemStatus>; status_detail: string | null; last_sync_at?: string | null };
    try {
      const item = await new MalvoProvider().getItem(conn.provider_item_id);
      if (!isOwnedRealItem(item, context.userId)) throw new Error('Conexão não autorizada.');
      patch = { status: mapItemStatus(item), status_detail: item.executionStatus ?? null, last_sync_at: item.lastUpdatedAt ?? null };
    } catch (e) {
      if (e instanceof MalvoError && e.status === 404) patch = { status: 'revoked', status_detail: 'ITEM_NOT_FOUND' };
      else throw new Error('Não foi possível consultar o provedor.');
    }
    const saved = await supabaseAdmin.from('of_connections').update(patch).eq('id', conn.id).eq('user_id', context.userId);
    if (saved.error) throw new Error('Não foi possível atualizar a conexão.');
    return { status: patch.status };
  });

export const revokeConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ connectionId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { MalvoProvider, MalvoError } = await import('./malvo.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: conn } = await supabaseAdmin.from('of_connections').select('id, provider_item_id').eq('id', data.connectionId).eq('user_id', context.userId).eq('provider', 'malvo').maybeSingle();
    if (!conn?.provider_item_id) throw new Error('Conexão não encontrada.');
    try { await new MalvoProvider().revokeConsent(conn.provider_item_id); }
    catch (e) { if (!(e instanceof MalvoError && e.status === 404)) throw new Error('Não foi possível revogar no provedor.'); }
    const saved = await supabaseAdmin.from('of_connections').update({ status: 'revoked', status_detail: 'REVOKED_BY_USER' }).eq('id', conn.id).eq('user_id', context.userId);
    if (saved.error) throw new Error('Não foi possível salvar a revogação.');
    return { ok: true };
  });

export const listMyConnections = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('of_connections').select('id, institution_name, status, status_detail, last_sync_at, created_at').order('created_at', { ascending: false });
  if (error) throw new Error('Não foi possível carregar suas conexões.');
  return data ?? [];
});
