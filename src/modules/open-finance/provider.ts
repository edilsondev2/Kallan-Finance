/** Implement only against a contracted provider's official documentation. */
export interface OpenFinanceInstitution { id:string; name:string; products:string[] }
export interface OpenFinanceProvider {
 listInstitutions():Promise<OpenFinanceInstitution[]>;
 startConsent(input:{institutionId:string;userId:string;returnUrl:string;/** typed by the user, sent only to the provider, never stored by Kallan */taxId?:string|undefined}):Promise<{consentId:string;authorizationUrl:string}>;
 getConsent(consentId:string):Promise<{status:'pending'|'authorized'|'expired'|'revoked';expiresAt:string|null}>;
 synchronize(consentId:string):Promise<{providerConfirmed:boolean;updatedAt:string}>;
 revokeConsent(consentId:string):Promise<void>;
}
export const OPEN_FINANCE_READINESS = { available:false, provider:'Malvo', missing:['Documentação oficial','Credenciais e contrato do provedor','Cobertura de instituições e permissões confirmadas'] } as const;

/** The contracted provider, or null while none is configured (the UI then shows a clearly labelled preview). */
export function getOpenFinanceProvider():OpenFinanceProvider|null{
 // Return the real implementation here once the provider is contracted and OPEN_FINANCE_READINESS.available is true.
 return null;
}
