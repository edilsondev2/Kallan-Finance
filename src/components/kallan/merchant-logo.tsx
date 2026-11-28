import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Well-known merchants (keyword in the statement description -> website). Only listed names get a logo. */
const MERCHANTS: [string, string][] = [
  ["americanas", "americanas.com.br"], ["ifood", "ifood.com.br"], ["netflix", "netflix.com"], ["spotify", "spotify.com"],
  ["uber", "uber.com"], ["99 pop", "99app.com"], ["99app", "99app.com"], ["rappi", "rappi.com.br"], ["amazon", "amazon.com.br"],
  ["amzn", "amazon.com.br"], ["mercado livre", "mercadolivre.com.br"], ["mercadolivre", "mercadolivre.com.br"], ["mercado pago", "mercadopago.com.br"],
  ["magalu", "magazineluiza.com.br"], ["magazine luiza", "magazineluiza.com.br"], ["shopee", "shopee.com.br"], ["aliexpress", "aliexpress.com"],
  ["shein", "shein.com"], ["casas bahia", "casasbahia.com.br"], ["carrefour", "carrefour.com.br"], ["pao de acucar", "paodeacucar.com"],
  ["assai", "assai.com.br"], ["atacadao", "atacadao.com.br"], ["renner", "lojasrenner.com.br"], ["riachuelo", "riachuelo.com.br"],
  ["c&a", "cea.com.br"], ["zara", "zara.com"], ["nike", "nike.com.br"], ["centauro", "centauro.com.br"], ["netshoes", "netshoes.com.br"],
  ["disney", "disneyplus.com"], ["hbo", "max.com"], ["max.com", "max.com"], ["prime video", "primevideo.com"], ["globoplay", "globoplay.globo.com"],
  ["youtube", "youtube.com"], ["google", "google.com"], ["apple.com", "apple.com"], ["apple", "apple.com"], ["microsoft", "microsoft.com"],
  ["openai", "openai.com"], ["anthropic", "anthropic.com"], ["claude.ai", "claude.ai"], ["github", "github.com"], ["steam", "steampowered.com"],
  ["playstation", "playstation.com"], ["xbox", "xbox.com"], ["deezer", "deezer.com"], ["vivo", "vivo.com.br"], ["claro", "claro.com.br"],
  ["shell", "shell.com.br"], ["ipiranga", "ipiranga.com.br"], ["petrobras", "petrobras.com.br"], ["drogasil", "drogasil.com.br"], 
  ["pague menos", "paguemenos.com.br"], ["pacheco", "drogariaspacheco.com.br"], ["mcdonald", "mcdonalds.com.br"], ["burger king", "burgerking.com.br"],
  ["subway", "subway.com"], ["starbucks", "starbucks.com.br"], ["kfc", "kfc.com.br"], ["outback", "outback.com.br"], ["smart fit", "smartfit.com.br"],
  ["smartfit", "smartfit.com.br"], ["latam", "latamairlines.com"], ["gol linhas", "voegol.com.br"], ["booking", "booking.com"],
  ["airbnb", "airbnb.com.br"], ["decolar", "decolar.com"], ["leroy merlin", "leroymerlin.com.br"], ["kabum", "kabum.com.br"], ["dafiti", "dafiti.com.br"],
  ["sem parar", "semparar.com.br"], ["picpay", "picpay.com"], 
  
];

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function merchantDomain(description: string): string | null {
  const d = ` ${strip(description).replace(/[*_\-/.]/g, (c) => (c === "." ? "." : " "))} `;
  for (const [k, dom] of MERCHANTS) {
    if (new RegExp(`[^a-z0-9]${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z0-9]`).test(d)) return dom;
  }
  return null;
}

/**
 * Shows the merchant's logo when the statement description names a known merchant, otherwise the fallback.
 * The logo is fetched by the browser from Google's favicon service (only the merchant's domain is sent).
 */
export function MerchantLogo({ description, size = 40, fallback, className }: { description: string; size?: number; fallback: ReactNode; className?: string }) {
  const [failed, setFailed] = useState(false);
  const domain = merchantDomain(description);
  if (!domain || failed) return <>{fallback}</>;
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white", className)} style={{ width: size, height: size }}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
        alt=""
        width={size - 12}
        height={size - 12}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        onLoad={(e) => { if (e.currentTarget.naturalWidth <= 16) setFailed(true); }}
        className="object-contain"
      />
    </span>
  );
}
