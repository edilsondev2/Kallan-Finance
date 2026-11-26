import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { KallanGlyph } from "./logo";

export type CelebrationItem = { id: string; title: string; text: string };

const SEEN_KEY = "kf-celebrated";

export function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function markSeen(id: string) {
  try {
    const next = [...new Set([...readSeen(), id])].slice(-40);
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable: the celebration may show again, which is harmless
  }
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  a: i * 20,
  r: 64 + (i % 3) * 30,
  d: (i % 5) * 45,
  big: i % 4 === 0,
}));

/** One-time celebration card with a burst of violet particles. Content must come from real data. */
export function Celebrate({ item }: { item: CelebrationItem | null }) {
  const [open, setOpen] = useState<CelebrationItem | null>(null);

  useEffect(() => {
    if (!item) return undefined;
    setOpen(item);
    markSeen(item.id);
    const t = window.setTimeout(() => setOpen(null), 7000);
    return () => window.clearTimeout(t);
  }, [item]);

  if (!open) return null;
  return (
    <div className="k-cele" role="status" aria-live="polite">
      <div className="k-cele-burst" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <i key={i} className={p.big ? "big" : undefined} style={{ "--a": `${p.a}deg`, "--r": `${p.r}px`, "--d": `${p.d}ms` } as React.CSSProperties} />
        ))}
      </div>
      <span className="k-mark big">
        <KallanGlyph animated />
      </span>
      <div className="k-cele-body">
        <b>{open.title}</b>
        <p>{open.text}</p>
      </div>
      <button type="button" className="k-cele-x" aria-label="Fechar" onClick={() => setOpen(null)}>
        <X />
      </button>
    </div>
  );
}
