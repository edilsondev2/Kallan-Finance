const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return brl.format(Number.isFinite(n) ? n : 0);
}

export function formatBRLCompact(value: number): string {
  return brlCompact.format(value);
}

/** ratio 0.12 -> "12%" */
export function formatPercent(ratio: number): string {
  return pct.format(ratio);
}

export function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? parseLocalDate(date) : date;
  return d.toLocaleDateString("pt-BR", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Parses "YYYY-MM-DD" as a local date (avoids UTC off-by-one). */
export function parseLocalDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return new Date(value);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Local date -> "YYYY-MM-DD" */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthLabel(d: Date): string {
  const s = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Boa noite";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "K";
}
