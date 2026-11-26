import { toNumber, parseLocalDate } from "@/lib/format";
import type { FinanceData } from "./types";

export type UpcomingBill = {
  id: string;
  name: string;
  amount: number;
  /** YYYY-MM-DD */
  due: string;
  /** Whole days from today; negative when past due. */
  days: number;
  overdue: boolean;
};

/**
 * Credit card invoices that still need attention (open, closed or overdue), nearest due date first.
 * An open invoice is not a debt in arrears: only status "overdue" is flagged as such.
 */
export function upcomingInvoices(data: Pick<FinanceData, "cards" | "invoices">, now: Date = new Date()): UpcomingBill[] {
  const cardName = new Map(data.cards.map((c) => [c.id, c.name]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const out: UpcomingBill[] = [];
  for (const inv of data.invoices) {
    if (inv.status !== "open" && inv.status !== "closed" && inv.status !== "overdue") continue;
    const due = inv.due_date;
    if (!due) continue;
    out.push({
      id: inv.id,
      name: `Fatura ${cardName.get(inv.card_id) ?? "do cartão"}`,
      amount: toNumber(inv.amount),
      due,
      days: Math.round((parseLocalDate(due).getTime() - today) / 86_400_000),
      overdue: inv.status === "overdue",
    });
  }
  return out.sort((a, b) => a.days - b.days);
}

export function dueLabel(days: number): string {
  if (days < 0) return `Vencida há ${-days} ${-days === 1 ? "dia" : "dias"}`;
  if (days === 0) return "Vence hoje";
  return `Vence em ${days} ${days === 1 ? "dia" : "dias"}`;
}
