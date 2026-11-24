import { createFileRoute } from "@tanstack/react-router";
import { PreferencesPage } from "@/modules/settings/components/preferences";
import { accountPanelOptions } from "@/modules/settings/panel-queries";
import { FinanceError, FinanceNotFound, FinancePending } from "@/modules/finance/components/route-states";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/configuracoes")({
  head: () => pageHead("Configurações", "Gerencie privacidade dos valores, demonstração e preferências de notificações."),
  loader: ({context}) => context.queryClient.ensureQueryData(accountPanelOptions(context.user.id)),
  errorComponent: FinanceError,
  notFoundComponent: FinanceNotFound,
  pendingComponent: FinancePending,
  component: PreferencesPage,
});
