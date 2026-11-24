import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/modules/notifications/notifications-page";
import { notificationsOptions } from "@/modules/notifications/queries";
import { FinanceError, FinanceNotFound, FinancePending } from "@/modules/finance/components/route-states";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/notificacoes")({
  head: () => pageHead("Notificações", "Acompanhe seus avisos e atualizações do Kallan Finance."),
  loader: ({context}) => context.queryClient.ensureQueryData(notificationsOptions(context.user.id)),
  errorComponent: FinanceError,
  notFoundComponent: FinanceNotFound,
  pendingComponent: FinancePending,
  component: NotificationsPage,
});
