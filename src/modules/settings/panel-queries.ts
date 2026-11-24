import { queryOptions } from '@tanstack/react-query';
import { getAccountPanel } from './settings.functions';
export const accountPanelOptions=(userId:string)=>queryOptions({queryKey:['account-panel',userId],queryFn:()=>getAccountPanel(),staleTime:30000});
