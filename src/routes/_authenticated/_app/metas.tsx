import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/modules/finance/components/goals";
import { financeQueryOptions } from "@/modules/finance/queries";
import { FinanceError, FinanceNotFound, FinancePending } from "@/modules/finance/components/route-states";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/metas")({
  head: () => pageHead("Metas", "Defina objetivos financeiros e registre seu progresso sem movimentar dinheiro."),
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQueryOptions(context.user.id)),
  errorComponent: FinanceError,
  notFoundComponent: FinanceNotFound,
  pendingComponent: FinancePending,
  component: GoalsPage,
});
