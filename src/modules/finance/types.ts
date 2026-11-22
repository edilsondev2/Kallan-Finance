import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];
export type Account = T["accounts"]["Row"];
export type CreditCard = T["credit_cards"]["Row"];
export type CardInvoice = T["card_invoices"]["Row"];
export type Investment = T["investments"]["Row"];
export type Transaction = T["transactions"]["Row"];
export type Category = T["categories"]["Row"];
export type BalanceSnapshot = T["balance_snapshots"]["Row"];
export type Goal = T["goals"]["Row"];
export type TxType = Database["public"]["Enums"]["tx_type"];
export type TxDirection = Database["public"]["Enums"]["tx_direction"];
export type DataSource = Database["public"]["Enums"]["data_source"];

export type FinanceData = {
  accounts: Account[];
  cards: CreditCard[];
  invoices: CardInvoice[];
  investments: Investment[];
  transactions: Transaction[];
  categories: Category[];
  snapshots: BalanceSnapshot[];
  goals: Goal[];
};

export type FinanceMode = "real" | "demo" | "empty";

export const TX_TYPE_LABEL: Record<TxType, string> = {
  income: "Entrada",
  expense: "Saída",
  payment: "Pagamento",
  card_purchase: "Compra no cartão",
  transfer: "Transferência",
  other: "Outro",
};

export const ACCOUNT_TYPE_LABEL: Record<Account["type"], string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira / dinheiro",
  other: "Outra conta",
};
