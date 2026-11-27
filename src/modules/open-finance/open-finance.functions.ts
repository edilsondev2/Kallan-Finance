import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { OpenFinanceInstitution } from './provider';
import { mapItemStatus, isOwnedRealItem, institutionExists } from './calculations';

export const listOpenFinanceInstitutions = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async (): Promise<OpenFinanceInstitution[]> => {
  const { MalvoProvider } = await import('./malvo.server');
  return new MalvoProvider().listInstitutions();
});

/** Technical detail for the empty state: is test mode on, and what does Malvo return per listing variant. */
export const openFinanceDiagnostics = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async () => {
  const { probeConnectors, sandboxAllowed } = await import('./malvo.server');
  try {
    return { sandboxMode: sandboxAllowed(), probes: await probeConnectors() };
  } catch {
    return { sandboxMode: sandboxAllowed(), probes: [] };
  }
});

export const createConnectToken = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ institutionId: z.string().regex(/^\d+$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { MalvoProvider, sandboxAllowed } = await import('./malvo.server');
    const provider = new MalvoProvider();
    const institutions = await provider.listInstitutions();
    if (!institutionExists(institutions, data.institutionId, sandboxAllowed())) throw new Error('Esta instituição não está habilitada para conexões reais.');
    return provider.createConnectToken(context.userId);
  });

const uuid = z.string().uuid();

const CONN_COLS = 'id, user_id, provider, provider_item_id, institution_name';

async function loadConnection(id: string, userId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('of_connections').select(CONN_COLS).eq('id', id).eq('user_id', userId).in('provider', ['malvo', 'malvo_sandbox']).maybeSingle();
  if (!data?.provider_item_id) throw new Error('Conexão não encontrada.');
  return data;
}

/** Records an item the user just authorized, then imports its data. Trusts only what the provider returns for it. */
export const registerConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ itemId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { MalvoProvider, MalvoError, sandboxAllowed } = await import('./malvo.server');
    const { syncConnection } = await import('./sync.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const item = await new MalvoProvider().getItem(data.itemId);
    const status = mapItemStatus(item);
    const sandbox = item.connector.isSandbox === true;
    // A sandbox item is accepted only in test mode and only for its owner; it is stored under its own provider name so it can never pass for a real bank.
    if (sandbox ? !(sandboxAllowed() && item.clientUserId === context.userId) : !isOwnedRealItem(item, context.userId)) throw new Error('Conexão não pertence a esta conta.');
    const { data: row, error } = await supabaseAdmin
      .from('of_connections')
      .upsert({ user_id: context.userId, provider: sandbox ? 'malvo_sandbox' : 'malvo', provider_item_id: item.id, institution_name: item.connector.name, status, status_detail: item.executionStatus ?? null, last_sync_at: item.lastUpdatedAt ?? null }, { onConflict: 'provider,provider_item_id' })
      .select('id, user_id, provider, provider_item_id, institution_name, status')
      .single();
    if (error) { console.error('[open-finance] save connection failed', error.code); throw new Error('Não foi possível salvar a conexão.'); }
    let sync: Awaited<ReturnType<typeof syncConnection>> | null = null;
    let syncError: string | null = null;
    if (status !== 'failed' && status !== 'consent_expired') {
      try { sync = await syncConnection(row); }
      catch (e) {
        if (e instanceof MalvoError && e.code === 'ITEM_CONSENT_TERMINATED') await supabaseAdmin.from('of_connections').update({ status: 'consent_expired', status_detail: e.code }).eq('id', row.id);
        syncError = 'A importação dos dados falhou. Use "Atualizar dados" para tentar de novo.';
      }
    }
    return { id: row.id, status: row.status, sandbox, sync, syncError };
  });

/** Re-reads the item status from Malvo and imports the latest data. */
export const refreshConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ connectionId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { MalvoProvider, MalvoError, sandboxAllowed } = await import('./malvo.server');
    const { syncConnection, isTestConnection } = await import('./sync.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const conn = await loadConnection(data.connectionId, context.userId);
    let patch: { status: 'revoked' | ReturnType<typeof mapItemStatus>; status_detail: string | null; last_sync_at?: string | null };
    try {
      const item = await new MalvoProvider().getItem(conn.provider_item_id);
      const owned = isTestConnection(conn) ? sandboxAllowed() && item.clientUserId === context.userId : isOwnedRealItem(item, context.userId);
      if (!owned) throw new Error('Conexão não autorizada.');
      patch = { status: mapItemStatus(item), status_detail: item.executionStatus ?? null, last_sync_at: item.lastUpdatedAt ?? null };
    } catch (e) {
      if (e instanceof MalvoError && e.status === 404) patch = { status: 'revoked', status_detail: 'ITEM_NOT_FOUND' };
      else throw new Error('Não foi possível consultar o provedor.');
    }
    const saved = await supabaseAdmin.from('of_connections').update(patch).eq('id', conn.id).eq('user_id', context.userId);
    if (saved.error) throw new Error('Não foi possível atualizar a conexão.');
    let sync: Awaited<ReturnType<typeof syncConnection>> | null = null;
    if (patch.status !== 'revoked' && patch.status !== 'failed' && patch.status !== 'consent_expired') {
      try { sync = await syncConnection(conn); }
      catch (e) {
        if (e instanceof MalvoError && e.code === 'ITEM_CONSENT_TERMINATED') await supabaseAdmin.from('of_connections').update({ status: 'consent_expired', status_detail: e.code }).eq('id', conn.id);
        throw new Error('A importação dos dados falhou.');
      }
    }
    return { status: patch.status, sync };
  });

/** Shows what Malvo returns for a connection next to what Kallan stored (counts and balances). */
export const inspectConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ connectionId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { inspectConnection: inspect } = await import('./sync.server');
    try { return await inspect(await loadConnection(data.connectionId, context.userId)); }
    catch (e) { console.error('[open-finance] inspect failed', e instanceof Error ? e.message : 'erro'); throw new Error('Não foi possível conferir os dados agora.'); }
  });

export const revokeConnection = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ connectionId: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { MalvoProvider, MalvoError } = await import('./malvo.server');
    const { deleteConnectionData, isTestConnection } = await import('./sync.server');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const conn = await loadConnection(data.connectionId, context.userId);
    try { await new MalvoProvider().revokeConsent(conn.provider_item_id); }
    catch (e) { if (!(e instanceof MalvoError && e.status === 404)) throw new Error('Não foi possível revogar no provedor.'); }
    if (isTestConnection(conn)) {
      // Test data is removed completely so it cannot linger next to real data.
      await deleteConnectionData(conn);
      const gone = await supabaseAdmin.from('of_connections').delete().eq('id', conn.id).eq('user_id', context.userId);
      if (gone.error) throw new Error('Não foi possível remover a conexão de teste.');
      return { ok: true };
    }
    const saved = await supabaseAdmin.from('of_connections').update({ status: 'revoked', status_detail: 'REVOKED_BY_USER' }).eq('id', conn.id).eq('user_id', context.userId);
    if (saved.error) throw new Error('Não foi possível salvar a revogação.');
    return { ok: true };
  });

export const listMyConnections = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('of_connections').select('id, provider, institution_name, status, status_detail, last_sync_at, created_at').order('created_at', { ascending: false });
  if (error) throw new Error('Não foi possível carregar suas conexões.');
  return data ?? [];
});
