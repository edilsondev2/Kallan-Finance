import { cn } from "@/lib/utils";
import { formatBRL, toNumber } from "@/lib/format";
import { useHideValues } from "@/modules/settings/queries";
import { useCountUp } from "@/lib/use-count-up";

type Props = {
  value: number | string | null | undefined;
  className?: string;
  /** colorize by sign */
  tone?: "auto" | "positive" | "negative" | "neutral";
  signed?: boolean;
  /** force hidden state (e.g. demo) */
  hidden?: boolean;
  /** count up from zero when it first appears */
  count?: boolean;
};

/** Monetary value that respects the global "hide values" preference. */
export function Money({ value, className, tone = "neutral", signed = false, hidden, count = false }: Props) {
  const [hideGlobal] = useHideValues();
  const isHidden = hidden ?? hideGlobal;
  const n = toNumber(value);
  const shown = useCountUp(n, count && !isHidden);
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
  const display = isHidden || !count ? text : `${signed && n > 0 ? "+" : ""}${formatBRL(shown)}`;
  return (
    <span className={cn("tabular whitespace-nowrap", color, className)} aria-label={isHidden ? "Valor oculto" : text}>
      {display}
    </span>
  );
}
