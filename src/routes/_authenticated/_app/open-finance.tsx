import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsPage } from "@/modules/open-finance/connections-page";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/open-finance")({
  head: () => pageHead("Open Finance", "Conexões bancárias somente para leitura com consentimento oficial."),
  component: ConnectionsPage,
});
