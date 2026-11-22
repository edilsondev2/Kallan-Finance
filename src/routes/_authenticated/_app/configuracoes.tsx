import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Configurações" />
    </Page>
  ),
});
