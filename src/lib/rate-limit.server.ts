/**
 * Small in-memory sliding-window limiter for server functions that cost money or call third parties.
 * It is per server instance (serverless instances do not share memory), so it slows abuse and runaway loops
 * rather than guaranteeing a global quota. Real per-IP login limits belong to the auth provider settings.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) throw new Error('Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.');
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
}
