import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { financeMutationSchema, financeDeleteSchema } from './schemas';
import type { FinanceData } from './types';

export const getFinance = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = context.supabase;
  const [accounts,cards,invoices,investments,categories,snapshots,goals] = await Promise.all([
    db.from('accounts').select('*').order('created_at'), db.from('credit_cards').select('*').order('created_at'),
    db.from('card_invoices').select('*').order('reference_month',{ascending:false}), db.from('investments').select('*').order('amount',{ascending:false}),
    db.from('categories').select('*').eq('scope','personal').order('name'), db.from('balance_snapshots').select('*').order('captured_at',{ascending:false}).limit(500),
    db.from('goals').select('*').eq('scope','personal').order('created_at'),
  ]);
  if ([accounts,cards,invoices,investments,categories,snapshots,goals].some(r => r.error)) throw new Error('Não foi possível carregar suas finanças.');
  const transactions: FinanceData['transactions'] = [];
  // Read every page, rather than silently calculating totals from a truncated history.
  for (let start = 0; ; start += 1000) {
    const result = await db.from('transactions').select('*').order('occurred_on',{ascending:false}).order('id').range(start,start+999);
    if(result.error) throw new Error('Não foi possível carregar as movimentações.');
    transactions.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 1000) break;
  }
  return { accounts: accounts.data ?? [], cards: cards.data ?? [], invoices: invoices.data ?? [], investments: investments.data ?? [], transactions, categories: categories.data ?? [], snapshots: snapshots.data ?? [], goals: goals.data ?? [] } satisfies FinanceData;
});

export const saveFinance = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).inputValidator(input => financeMutationSchema.parse(input)).handler(async ({data,context}) => {
  const db = context.supabase; const user_id = context.userId;
  if (data.entity === 'transaction' && data.category_id) {
    const category = await db.from('categories').select('id').eq('id',data.category_id).eq('scope','personal').maybeSingle();
    if(category.error || !category.data) throw new Error('A categoria não está disponível para sua conta.');
  }
  if(data.entity === 'transaction' && ((data.type === 'income' && data.direction !== 'in') || (['expense','payment','card_purchase'].includes(data.type) && data.direction !== 'out'))) {
    throw new Error('A direção não corresponde ao tipo de movimentação.');
  }
  if(data.entity === 'invoice') {
    const card = await db.from('credit_cards').select('id').eq('id',data.card_id).eq('user_id',user_id).eq('source','manual').maybeSingle();
    if(card.error || !card.data) throw new Error('Selecione um cartão manual da sua conta.');
  }
  if(data.entity === 'contribution') {
    const goal = await db.from('goals').select('id').eq('id',data.goal_id).eq('user_id',user_id).eq('scope','personal').maybeSingle();
    if(goal.error || !goal.data) throw new Error('A meta não está disponível para sua conta.');
  }
  let result;
  switch(data.entity) {
    case 'transaction': { const row = { description:data.description, amount:data.amount, occurred_on:data.occurred_on, type:data.type, direction:data.direction, category_id:data.category_id, institution_name:data.institution_name || null, notes:data.notes || null };
      result = data.id ? await db.from('transactions').update(row).eq('id',data.id).eq('user_id',user_id).eq('source','manual').select('id').single() : await db.from('transactions').insert({...row,user_id,source:'manual'}).select('id').single(); break; }
    case 'account': { const row = {name:data.name,balance:data.balance,type:data.type,institution_name:data.institution_name || null,balance_updated_at:new Date().toISOString()};
      result = data.id ? await db.from('accounts').update(row).eq('id',data.id).eq('user_id',user_id).eq('source','manual').select('id').single() : await db.from('accounts').insert({...row,user_id,source:'manual'}).select('id').single(); break; }
    case 'investment': { const row = {name:data.name,amount:data.amount,kind:data.kind,position_date:data.position_date,institution_name:data.institution_name || null};
      result = data.id ? await db.from('investments').update(row).eq('id',data.id).eq('user_id',user_id).eq('source','manual').select('id').single() : await db.from('investments').insert({...row,user_id,source:'manual'}).select('id').single(); break; }
    case 'card': { if(data.available_limit > data.credit_limit) throw new Error('O limite disponível não pode superar o limite total.'); const row = {name:data.name,credit_limit:data.credit_limit,available_limit:data.available_limit,last_four:data.last_four || null,institution_name:data.institution_name || null};
      result = data.id ? await db.from('credit_cards').update(row).eq('id',data.id).eq('user_id',user_id).eq('source','manual').select('id').single() : await db.from('credit_cards').insert({...row,user_id,source:'manual'}).select('id').single(); break; }
    case 'invoice': { const row = {card_id:data.card_id,amount:data.amount,reference_month:data.reference_month,due_date:data.due_date,status:data.status}; result = data.id ? await db.from('card_invoices').update(row).eq('id',data.id).eq('user_id',user_id).eq('source','manual').select('id').single() : await db.from('card_invoices').insert({...row,user_id,source:'manual'}).select('id').single(); break; }
    case 'goal': { const row = {title:data.title,target_amount:data.target_amount,deadline:data.deadline}; result = data.id ? await db.from('goals').update(row).eq('id',data.id).eq('user_id',user_id).eq('scope','personal').select('id').single() : await db.from('goals').insert({...row,user_id,scope:'personal'}).select('id').single(); break; }
    case 'contribution': result = await db.from('goal_contributions').insert({user_id,goal_id:data.goal_id,amount:data.amount,note:data.note || null}).select('id').single(); break;
    case 'category': result = await db.from('categories').insert({user_id,name:data.name,kind:data.kind,scope:'personal'}).select('id').single(); break;
  }
  if(result.error) throw new Error('Não foi possível salvar. Verifique os dados e tente novamente.');
  return result.data;
});

export const deleteFinance = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input => financeDeleteSchema.parse(input)).handler(async ({data,context}) => {
  const result = data.entity === 'goal'
    ? await context.supabase.from('goals').delete().eq('id',data.id).eq('user_id',context.userId).select('id').single()
    : await context.supabase.from(({transaction:'transactions',account:'accounts',investment:'investments',card:'credit_cards',invoice:'card_invoices'} as const)[data.entity]).delete().eq('id',data.id).eq('user_id',context.userId).eq('source','manual').select('id').single();
  if(result.error) throw new Error('Não foi possível excluir esse registro.');
  return {ok:true};
});
