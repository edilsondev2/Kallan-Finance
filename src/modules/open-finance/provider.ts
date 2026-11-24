/** Implement only against a contracted provider's official documentation. */
export interface OpenFinanceInstitution { id:string; name:string; products:string[] }
export interface OpenFinanceProvider {
 listInstitutions():Promise<OpenFinanceInstitution[]>;
 startConsent(input:{institutionId:string;userId:string;returnUrl:string}):Promise<{consentId:string;authorizationUrl:string}>;
 getConsent(consentId:string):Promise<{status:'pending'|'authorized'|'expired'|'revoked';expiresAt:string|null}>;
 synchronize(consentId:string):Promise<{providerConfirmed:boolean;updatedAt:string}>;
 revokeConsent(consentId:string):Promise<void>;
}
export const OPEN_FINANCE_READINESS = { available:false, provider:'Malvo', missing:['Documentação oficial','Credenciais e contrato do provedor','Cobertura de instituições e permissões confirmadas'] } as const;
