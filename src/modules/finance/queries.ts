import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/modules/auth/auth-context";
import { useSettings } from "@/modules/settings/queries";
import { buildDemoData } from "@/modules/demo/demo-data";
import type { FinanceData, FinanceMode } from "./types";

export const financeKeys = {
  all: (userId: string) => ["finance", userId] as const,
  categories: (userId: string) => ["categories", userId] as const,
};

/** Loads all personal finance data for the signed-in user (RLS-scoped). */
export function useRealFinanceData() {
  const userId = useUserId();
  return useQuery({
    queryKey: financeKeys.all(userId),
    enabled: !!userId,
    queryFn: async (): Promise<FinanceData> => {
      const since = new Date();
      since.setMonth(since.getMonth() - 12);
      const sinceStr = since.toISOString().slice(0, 10);
      const [accounts, cards, invoices, investments, transactions, categories, snapshots, goals] = await Promise.all([
        supabase.from("accounts").select("*").order("created_at"),
        supabase.from("credit_cards").select("*").order("created_at"),
        supabase.from("card_invoices").select("*").order("reference_month", { ascending: false }),
        supabase.from("investments").select("*").order("amount", { ascending: false }),
        supabase.from("transactions").select("*").gte("occurred_on", sinceStr).order("occurred_on", { ascending: false }).limit(1000),
        supabase.from("categories").select("*").order("name"),
        supabase.from("balance_snapshots").select("*").order("captured_at", { ascending: false }).limit(500),
        supabase.from("goals").select("*").eq("scope", "personal").order("created_at"),
      ]);
      const firstError = [accounts, cards, invoices, investments, transactions, categories, snapshots, goals].find((r) => r.error)?.error;
      if (firstError) throw firstError;
      return {
        accounts: accounts.data ?? [],
        cards: cards.data ?? [],
        invoices: invoices.data ?? [],
        investments: investments.data ?? [],
        transactions: transactions.data ?? [],
        categories: categories.data ?? [],
        snapshots: snapshots.data ?? [],
        goals: goals.data ?? [],
      };
    },
  });
}

export function hasRealData(d: FinanceData) {
  return d.accounts.length + d.cards.length + d.investments.length + d.transactions.length > 0;
}

/**
 * Real data when it exists; otherwise the clearly-labelled demo dataset (if enabled), else empty.
 * Demo and real data are never merged.
 */
export function useFinanceData(): {
  mode: FinanceMode;
  data: FinanceData | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const q = useRealFinanceData();
  const settings = useSettings();
  const refetch = () => void q.refetch();
  if (q.isLoading || settings.isLoading) return { mode: "empty", data: undefined, isLoading: true, isError: false, refetch };
  if (q.isError || !q.data) return { mode: "empty", data: undefined, isLoading: false, isError: true, refetch };
  if (hasRealData(q.data)) return { mode: "real", data: q.data, isLoading: false, isError: false, refetch };
  if (settings.data?.show_demo ?? true) return { mode: "demo", data: buildDemoData(), isLoading: false, isError: false, refetch };
  return { mode: "empty", data: q.data, isLoading: false, isError: false, refetch };
}

export function useCategories(scope: "personal" | "business" = "personal") {
  const userId = useUserId();
  return useQuery({
    queryKey: [...financeKeys.categories(userId), scope],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("scope", scope).order("name");
      if (error) throw error;
      return data;
    },
  });
}
