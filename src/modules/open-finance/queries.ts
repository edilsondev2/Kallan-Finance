import { queryOptions } from '@tanstack/react-query';
import { listOpenFinanceInstitutions, listMyConnections } from './open-finance.functions';
export const institutionsOptions = (userId: string) => queryOptions({ queryKey: ['of-institutions', userId], queryFn: () => listOpenFinanceInstitutions(), staleTime: 5 * 60_000 });
export const connectionsOptions = (userId: string) => queryOptions({ queryKey: ['of-connections', userId], queryFn: () => listMyConnections(), staleTime: 30_000 });
