/** Implement only against a contracted provider's official documentation. */
export interface OpenFinanceInstitution { id: string; name: string; products: string[]; imageUrl?: string | null | undefined; sandbox?: boolean | undefined }

/** Malvo (https://docs.malvo.io) is configured through the server-side secrets `Malvo` and `Malvo2`. */
export const OPEN_FINANCE_READINESS = { available: true, provider: 'Malvo', missing: [] as string[] } as const;
