import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInstitutionLogos } from "@/modules/open-finance/open-finance.functions";

export const normName = (s: string) => s.replace(/\s*\(teste\)\s*$/i, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

/** Institution logo (from the provider catalog) with initials as the fallback. */
export function InstitutionAvatar({ name, size = 52, imageUrl }: { name: string; size?: number; imageUrl?: string | undefined }) {
  const [failed, setFailed] = useState(false);
  const logos = useQuery({ queryKey: ["of-logos"], queryFn: () => getInstitutionLogos(), staleTime: 60 * 60_000, enabled: !imageUrl, retry: false });
  const url = imageUrl ?? logos.data?.[normName(name)];
  if (url && !failed) {
    return <span className="k-cn-av k-cn-logo" style={{ width: size, height: size }}><img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /></span>;
  }
  const words = name.trim().split(/\s+/);
  const initials = ((words[0]?.charAt(0) ?? "") + (words[1]?.charAt(0) ?? "")).toUpperCase();
  return <span className="k-cn-av bg-surface-2 text-foreground" style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden="true">{initials}</span>;
}
