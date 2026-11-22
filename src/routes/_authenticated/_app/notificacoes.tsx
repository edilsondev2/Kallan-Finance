import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/notificacoes")({
  head: () => ({ meta: [{ title: "Notificações — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Notificações" />
    </Page>
  ),
});
