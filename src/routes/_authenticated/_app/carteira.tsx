import { createFileRoute } from "@tanstack/react-router";
import { WalletPage } from "@/modules/finance/components/wallet";
import { financeQueryOptions } from "@/modules/finance/queries";
import { FinanceError, FinanceNotFound, FinancePending } from "@/modules/finance/components/route-states";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/carteira")({
  head: () => pageHead("Carteira", "Acompanhe contas, cartões, faturas e investimentos em uma visão consolidada."),
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQueryOptions(context.user.id)),
  errorComponent: FinanceError,
  notFoundComponent: FinanceNotFound,
  pendingComponent: FinancePending,
  component: WalletPage,
});
