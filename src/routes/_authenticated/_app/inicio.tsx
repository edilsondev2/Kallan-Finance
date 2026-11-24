import { createFileRoute } from "@tanstack/react-router";
import { Overview } from "@/modules/finance/components/overview";
import { financeQueryOptions } from "@/modules/finance/queries";
import { FinanceError, FinanceNotFound, FinancePending } from "@/modules/finance/components/route-states";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/inicio")({
  head: () => pageHead("Início", "Sua visão financeira: patrimônio, contas, faturas, gastos e próximos objetivos."),
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQueryOptions(context.user.id)),
  errorComponent: FinanceError,
  notFoundComponent: FinanceNotFound,
  pendingComponent: FinancePending,
  component: Overview,
});
