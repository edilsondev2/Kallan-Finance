import { useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldSelect } from '@/components/kallan/field';
import { toISODate } from '@/lib/format';
import { saveFinance, deleteFinance } from '../finance.functions';
import { financeMutationSchema } from '../schemas';
import { useRealFinanceData } from '../queries';
import { ACCOUNT_TYPE_LABEL, TX_TYPE_LABEL } from '../types';

type Entity = 'transaction'|'account'|'card'|'investment'|'invoice'|'goal'|'contribution'|'category';
const TITLES:Record<Entity,string> = {transaction:'Movimentação manual',account:'Conta manual',card:'Cartão manual',investment:'Investimento manual',invoice:'Fatura manual',goal:'Meta pessoal',contribution:'Registrar progresso',category:'Nova categoria'};
export function FinanceEditor({entity,initial={},children}: {entity:Entity;initial?:Record<string,unknown>;children:ReactNode}) {
  const [open,setOpen] = useState(false); const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  const save = useServerFn(saveFinance); const qc = useQueryClient(); const router = useRouter(); const {data} = useRealFinanceData();
  const initialString = (key:string,fallback='') => String(initial[key] ?? fallback);
  function input(key:string,label:string,type='text',fallback='') { return <Field key={key} label={label} htmlFor={entity+'-'+key}><Input id={entity+'-'+key} name={key} type={type} defaultValue={initialString(key,fallback)} required={!['notes','institution_name','deadline','last_four','note'].includes(key)} {...(type==='number'?{step:'0.01'}:{})}/></Field>; }
  function select(key:string,label:string,options:Record<string,string>,fallback='') {return <Field key={key} label={label} htmlFor={entity+'-'+key}><FieldSelect id={entity+'-'+key} name={key} defaultValue={initialString(key,fallback)}>{Object.entries(options).map(([value,text])=><option key={value} value={value}>{text}</option>)}</FieldSelect></Field>;}
  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    const fd = new FormData(e.currentTarget); const values = Object.fromEntries(fd.entries());
    const payload = {...values, entity, ...(typeof initial['id']==='string'?{id:initial['id']} : {}), ...(entity==='contribution'?{goal_id:initial['goal_id']} : {}), ...(entity==='transaction'?{category_id:values['category_id'] || null} : {}), ...(entity==='goal'?{deadline:values['deadline'] || null}: {})};
    const checked = financeMutationSchema.safeParse(payload);
    if(!checked.success) {setError(checked.error.issues[0]?.message ?? 'Verifique os campos.'); return;}
    setBusy(true);
    try { await save({data:checked.data}); await qc.invalidateQueries({queryKey:['finance']}); await qc.invalidateQueries({queryKey:['categories']}); await router.invalidate(); setOpen(false); toast.success('Registro salvo.'); }
    catch(err) {setError(err instanceof Error?err.message:'Não foi possível salvar.');} finally {setBusy(false);}
  }
  const today=toISODate(new Date());
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl"><DialogTitle>{TITLES[entity]}</DialogTitle><DialogDescription>{entity==='contribution'?'Registro de progresso, sem transferência de dinheiro.':'Registro informado por você, separado dos dados de instituições conectadas.'}</DialogDescription><form onSubmit={submit} className="space-y-4">
    {entity==='transaction' && <>{input('description','Descrição')}{select('type','Tipo',TX_TYPE_LABEL,'expense')}{select('direction','Direção',{'in':'Entrada','out':'Saída'},'out')}{input('amount','Valor (R$)','number')}{input('occurred_on','Data','date',today)}{select('category_id','Categoria',{'':'Sem categoria',...Object.fromEntries(data.categories.map(c=>[c.id,c.name]))})}{input('institution_name','Instituição (opcional)')}{input('notes','Observações (opcional)')}</>}
    {entity==='account' && <>{input('name','Nome da conta')}{input('institution_name','Instituição (opcional)')}{select('type','Tipo de conta',ACCOUNT_TYPE_LABEL,'checking')}{input('balance','Saldo informado (R$)','number','0')}</>}
    {entity==='investment' && <>{input('name','Nome do investimento')}{input('institution_name','Instituição (opcional)')}{input('kind','Tipo de investimento','text','Renda fixa')}{input('amount','Posição atual (R$)','number')}{input('position_date','Data da posição','date',today)}</>}
    {entity==='card' && <>{input('name','Nome do cartão')}{input('institution_name','Instituição (opcional)')}{input('credit_limit','Limite total (R$)','number','0')}{input('available_limit','Limite disponível (R$)','number','0')}{input('last_four','Últimos 4 dígitos (opcional)')}</>}
    {entity==='invoice' && <>{select('card_id','Cartão',Object.fromEntries(data.cards.filter(c=>c.source==='manual').map(c=>[c.id,c.name])))}{input('amount','Valor da fatura (R$)','number')}{input('reference_month','Referência','date',today.slice(0,7)+'-01')}{input('due_date','Vencimento','date',today)}{select('status','Situação',{'open':'Aberta','closed':'Fechada','paid':'Paga','overdue':'Vencida'},'open')}</>}
    {entity==='goal' && <>{input('title','Nome da meta')}{input('target_amount','Valor desejado (R$)','number')}{input('deadline','Prazo (opcional)','date')}</>}
    {entity==='contribution' && <>{input('amount','Valor acumulado a registrar (R$)','number')}{input('note','Observação (opcional)')}</>}
    {entity==='category' && <>{input('name','Nome da categoria')}{select('kind','Tipo',{'expense':'Despesa','income':'Receita'},'expense')}</>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<Save/>} Salvar</Button>
  </form></DialogContent></Dialog>;
}
export function DeleteRecord({entity,id}: {entity:'transaction'|'account'|'card'|'investment'|'invoice'|'goal';id:string}) {
  const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const remove=useServerFn(deleteFinance); const qc=useQueryClient();
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="Excluir registro" title="Excluir registro"><Trash2 className="text-destructive"/></Button></DialogTrigger><DialogContent className="w-[calc(100%-2rem)] rounded-2xl"><DialogTitle>Excluir registro?</DialogTitle><DialogDescription>Essa exclusão é permanente. Os registros associados podem também ser removidos.</DialogDescription>{error&&<p role="alert" className="text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={busy} onClick={async()=>{setBusy(true);try{await remove({data:{entity,id}});await qc.invalidateQueries({queryKey:['finance']});setOpen(false);toast.success('Registro excluído.');}catch(e){setError(e instanceof Error?e.message:'Erro ao excluir.');}finally{setBusy(false);}}}>Excluir</Button></div></DialogContent></Dialog>;
}
