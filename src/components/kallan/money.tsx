import { cn } from "@/lib/utils";
import { formatBRL, toNumber } from "@/lib/format";
import { useHideValues } from "@/modules/settings/queries";

type Props = {
  value: number | string | null | undefined;
  className?: string;
  /** colorize by sign */
  tone?: "auto" | "positive" | "negative" | "neutral";
  signed?: boolean;
  /** force hidden state (e.g. demo) */
  hidden?: boolean;
};

/** Monetary value that respects the global "hide values" preference. */
export function Money({ value, className, tone = "neutral", signed = false, hidden }: Props) {
  const [hideGlobal] = useHideValues();
  const isHidden = hidden ?? hideGlobal;
  const n = toNumber(value);
  const color =
    tone === "positive"
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : tone === "auto"
          ? n > 0
            ? "text-positive"
            : n < 0
              ? "text-negative"
              : ""
          : "";
  const text = isHidden ? "R$ ••••••" : `${signed && n > 0 ? "+" : ""}${formatBRL(n)}`;
  return (
    <span className={cn("tabular whitespace-nowrap", color, className)} aria-label={isHidden ? "Valor oculto" : text}>
      {text}
    </span>
  );
}
