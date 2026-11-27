import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsPage } from "@/modules/open-finance/connections-page";
import { pageHead } from "@/lib/metadata";
import { institutionsOptions, connectionsOptions } from '@/modules/open-finance/queries';
import { FinanceError, FinanceNotFound, FinancePending } from '@/modules/finance/components/route-states';

export const Route = createFileRoute("/_authenticated/_app/open-finance")({
  head: () => pageHead("Open Finance", "Conexões bancárias somente para leitura com consentimento oficial."),
  loader: async ({ context }) => {
    if (!context.userId) return;
    await Promise.all([context.queryClient.ensureQueryData(institutionsOptions(context.userId)), context.queryClient.ensureQueryData(connectionsOptions(context.userId))]);
  },
  errorComponent: FinanceError,
  pendingComponent: FinancePending,
  notFoundComponent: FinanceNotFound,
  component: ConnectionsPage,
});
