import { Plus, Target, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Page, PageHeader } from '@/components/kallan/page';
import { Money } from '@/components/kallan/money';
import { DemoBadge } from '@/components/kallan/badges';
import { ProgressBar } from '@/components/kallan/progress-bar';
import { EmptyState } from '@/components/kallan/states';
import { formatDate } from '@/lib/format';
import { useFinanceData } from '../queries';
import { goalProgress } from '../calculations';
import { FinanceEditor, DeleteRecord } from './editor';
export function GoalsPage() {
 const {data,mode}=useFinanceData(); if(!data)return null;
 return <Page><PageHeader title="Metas" eyebrow="Seu próximo passo" description="Transforme planos em progresso, no seu ritmo." actions={<FinanceEditor entity="goal"><Button><Plus/> Nova meta</Button></FinanceEditor>}/>{mode==='demo'&&<div className="mb-5"><DemoBadge/></div>}<div className="grid gap-4 md:grid-cols-2">{data.goals.map(g=><article key={g.id} className="surface-card p-6"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target/></span><h2 className="min-w-0 flex-1 break-words font-semibold">{g.title}</h2>{mode!=='demo'&&<><FinanceEditor entity="goal" initial={g}><Button variant="ghost" size="icon-sm" aria-label="Editar meta" title="Editar meta"><Pencil/></Button></FinanceEditor><DeleteRecord entity="goal" id={g.id}/></>}</div><div className="my-5 flex flex-wrap items-end justify-between gap-2"><div><Money value={g.current_amount} className="text-2xl font-semibold"/><p className="mt-1 text-xs text-muted-foreground">de <Money value={g.target_amount}/></p></div><span className="text-sm text-positive">{Math.round(goalProgress(g)*100)}%</span></div><ProgressBar value={goalProgress(g)}/><p className="mt-3 text-xs text-muted-foreground">{goalProgress(g)>=1?'Objetivo alcançado':g.deadline?`Prazo: ${formatDate(g.deadline)}`:'Sem prazo definido'}</p>{mode!=='demo'&&<FinanceEditor entity="contribution" initial={{goal_id:g.id}}><Button className="mt-5 w-full" variant="secondary"><Plus/> Registrar progresso</Button></FinanceEditor>}</article>)}</div>{!data.goals.length&&<EmptyState icon={Target} title="Qual é o seu próximo objetivo?" description="Uma reserva, uma viagem, um novo projeto. Sua primeira meta começa aqui." action={<FinanceEditor entity="goal"><Button><Plus/> Criar meta</Button></FinanceEditor>}/>}
 </Page>;
}
