import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
export const getAccountPanel = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async ({context})=>{
 const [profile,settings]=await Promise.all([context.supabase.from('profiles').select('*').eq('id',context.userId).single(),context.supabase.from('user_settings').select('*').eq('user_id',context.userId).single()]);
 if(profile.error||settings.error)throw new Error('Não foi possível carregar sua conta.');
 return {profile:profile.data,settings:settings.data};
});
