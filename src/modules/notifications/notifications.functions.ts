import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const getNotifications=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 const r=await context.supabase.from('notifications').select('*').eq('user_id',context.userId).order('created_at',{ascending:false}).limit(100);if(r.error)throw new Error('Não foi possível carregar os avisos.');return r.data;
});
export const markNotificationsRead=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(v=>z.object({id:z.string().uuid().optional()}).parse(v)).handler(async({data,context})=>{
 let q=context.supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',context.userId).is('read_at',null);if(data.id)q=q.eq('id',data.id);const r=await q;if(r.error)throw new Error('Não foi possível atualizar os avisos.');return {ok:true};
});
