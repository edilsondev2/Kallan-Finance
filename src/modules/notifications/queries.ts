import { queryOptions } from '@tanstack/react-query';
import { getNotifications } from './notifications.functions';
export const notificationsOptions=(userId:string)=>queryOptions({queryKey:['notifications',userId],queryFn:()=>getNotifications(),staleTime:30000});
