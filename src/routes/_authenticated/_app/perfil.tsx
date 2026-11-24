import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/modules/settings/components/profile";
import { accountPanelOptions } from "@/modules/settings/panel-queries";
import { FinanceError, FinanceNotFound, FinancePending } from "@/modules/finance/components/route-states";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/perfil")({
  head: () => pageHead("Perfil", "Atualize seu nome, foto e informações do perfil Kallan Finance."),
  loader: ({context}) => context.queryClient.ensureQueryData(accountPanelOptions(context.user.id)),
  errorComponent: FinanceError,
  notFoundComponent: FinanceNotFound,
  pendingComponent: FinancePending,
  component: ProfilePage,
});
