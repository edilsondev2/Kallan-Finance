import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsPage } from "@/modules/open-finance/connections-page";
import { pageHead } from "@/lib/metadata";
import { institutionsOptions, connectionsOptions } from '@/modules/open-finance/queries';
import { FinanceError, FinanceNotFound, FinancePending } from '@/modules/finance/components/route-states';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/_authenticated/_app/open-finance")({
  // Malvo sends the user back here after authorizing outside the app: ?itemId=...&status=SUCCESS|ERROR|CLOSED
  validateSearch: (s: Record<string, unknown>): { itemId?: string | undefined; status?: string | undefined; src?: string | undefined } => ({
    itemId: typeof s.itemId === "string" && UUID.test(s.itemId) ? s.itemId : undefined,
    status: s.status === "SUCCESS" || s.status === "ERROR" || s.status === "CLOSED" ? s.status : undefined,
    src: typeof s.src === "string" ? s.src.slice(0, 20) : undefined,
  }),
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
