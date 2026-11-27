export interface OpenFinanceInstitution { id: string; name: string; products: string[]; sandbox?: boolean | undefined; imageUrl?: string | undefined }
export interface ProviderItem {
  id: string; status: string; executionStatus?: string | null; clientUserId?: string | null;
  connector: { id: number; name: string; isSandbox?: boolean };
  products?: string[]; lastUpdatedAt?: string | null; consentExpiresAt?: string | null;
}
/** Screens use authenticated functions; vendor-specific REST stays in the adapter. */
export interface OpenFinanceProvider {
  listInstitutions(): Promise<OpenFinanceInstitution[]>;
  createConnectToken(userId: string): Promise<{ connectToken: string }>;
  getItem(itemId: string): Promise<ProviderItem>;
  revokeConsent(itemId: string): Promise<void>;
}
