import { useState } from 'react';
import { useSuspenseQuery,useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useUserId } from '@/modules/auth/auth-context';
import { Page, PageHeader } from '@/components/kallan/page';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/kallan/states';
import { formatDateTime } from '@/lib/format';
import { notificationsOptions } from './queries';
import { markNotificationsRead } from './notifications.functions';
export function NotificationsPage(){const userId=useUserId();const {data}=useSuspenseQuery(notificationsOptions(userId));const qc=useQueryClient();const mark=useServerFn(markNotificationsRead);const [busy,setBusy]=useState(false);
 async function read(id?:string){setBusy(true);try{await mark({data:id?{id}:{}});await Promise.all([qc.invalidateQueries({queryKey:['notifications']}),qc.invalidateQueries({queryKey:['notifications-unread']})]);}catch{toast.error('Não foi possível marcar como lida.');}finally{setBusy(false);}}
 return <Page><PageHeader title="Notificações" eyebrow="O que há de novo" actions={data.some(n=>!n.read_at)?<Button variant="outline" size="sm" disabled={busy} onClick={()=>void read()}><CheckCheck/> Marcar todas como lidas</Button>:null}/>{!data.length?<EmptyState icon={Bell} title="Tudo em dia" description="Seus avisos aparecerão aqui quando houver novidades."/>:<div className="divide-y divide-border">{data.map(n=><article key={n.id} className="flex items-start gap-4 py-5"><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${n.read_at?'bg-surface-2 text-muted-foreground':'bg-primary/10 text-primary'}`}><Bell className="size-4"/></span><div className="min-w-0 flex-1"><h2 className="text-sm font-medium">{n.title}</h2>{n.body&&<p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}<p className="mt-2 text-xs text-muted-foreground">{formatDateTime(n.created_at)}{n.read_at?' · Lida':''}</p></div>{!n.read_at&&<Button variant="ghost" size="icon-sm" title="Marcar como lida" aria-label="Marcar como lida" disabled={busy} onClick={()=>void read(n.id)}><Check/></Button>}</article>)}</div>}</Page>;
}
