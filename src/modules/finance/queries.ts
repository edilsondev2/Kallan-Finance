import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/modules/auth/auth-context";
import { useSettings } from "@/modules/settings/queries";
import { buildDemoData } from "@/modules/demo/demo-data";
import type { FinanceData, FinanceMode } from "./types";
import { getFinance } from "./finance.functions";

export const financeKeys = {
  all: (userId: string) => ["finance", userId] as const,
  categories: (userId: string) => ["categories", userId] as const,
};

/** Loads all personal finance data for the signed-in user (RLS-scoped). */
export const financeQueryOptions = (userId: string) => queryOptions({
  queryKey: financeKeys.all(userId),
  queryFn: () => getFinance(),
  staleTime: 30_000,
});

export function useRealFinanceData() {
  const userId = useUserId();
  return useSuspenseQuery(financeQueryOptions(userId));
}

export function hasRealData(d: FinanceData) {
  return d.accounts.length + d.cards.length + d.investments.length + d.transactions.length + d.goals.length > 0;
}

export function selectFinanceData(real: FinanceData, showDemo: boolean): { mode: FinanceMode; data: FinanceData } {
  if (hasRealData(real)) return { mode: "real", data: real };
  if (showDemo) return { mode: "demo", data: buildDemoData() };
  return { mode: "empty", data: real };
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
  if (settings.isError) throw settings.error;
  const refetch = () => void q.refetch();
  if (q.isLoading || settings.isLoading) return { mode: "empty", data: undefined, isLoading: true, isError: false, refetch };
  if (q.isError || !q.data) return { mode: "empty", data: undefined, isLoading: false, isError: true, refetch };
  return { ...selectFinanceData(q.data, settings.data?.show_demo ?? true), isLoading: false, isError: false, refetch };
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
