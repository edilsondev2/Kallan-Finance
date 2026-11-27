import type { OpenFinanceInstitution, ProviderItem } from './provider';

export function isRealInstitution(c: { isSandbox?: boolean; isOpenFinance?: boolean; country?: string; type?: string }): boolean {
  return c.isSandbox === false && c.isOpenFinance === true && c.country === 'BR' && c.type === 'PERSONAL_BANK';
}
/** Sandbox connector used only when test mode is enabled on the server. Never counted as a real bank. */
export function isTestInstitution(c: { isSandbox?: boolean; country?: string }): boolean {
  return c.isSandbox === true;
}
export function isOwnedRealItem(item: ProviderItem, userId: string): boolean {
  return item.clientUserId === userId && item.connector.isSandbox === false;
}
export function mapItemStatus(item: Pick<ProviderItem, 'status' | 'executionStatus'>) {
  if (item.executionStatus === 'USER_AUTHORIZATION_REVOKED') return 'consent_expired' as const;
  if (item.status === 'UPDATED' && item.executionStatus === 'SUCCESS') return 'completed' as const;
  if (item.status === 'UPDATED' && item.executionStatus === 'PARTIAL_SUCCESS') return 'verifying' as const;
  if (item.status === 'UPDATING') return 'syncing' as const;
  if (item.status === 'CREATING' || item.status === 'LOGIN_IN_PROGRESS') return 'connecting' as const;
  if (item.status === 'WAITING_USER_INPUT') return 'awaiting_authorization' as const;
  return 'failed' as const;
}
export function institutionExists(institutions: OpenFinanceInstitution[], id: string, allowSandbox = false) {
  return institutions.some(i => i.id === id && (i.sandbox === false || (allowSandbox && i.sandbox === true)));
}
