import { useRouter } from '@tanstack/react-router';
import { Page } from '@/components/kallan/page';
import { ErrorState, EmptyState, LoadingCards } from '@/components/kallan/states';
import { Search } from 'lucide-react';
export function FinanceError(){const router=useRouter();return <Page><ErrorState onRetry={()=>void router.invalidate()}/></Page>;}
export function FinanceNotFound(){return <Page><EmptyState icon={Search} title="Registro não encontrado"/></Page>;}
export function FinancePending(){return <Page><LoadingCards count={4}/></Page>;}
