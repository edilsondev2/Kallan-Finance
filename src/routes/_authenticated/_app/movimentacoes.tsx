import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/movimentacoes")({
  head: () => ({ meta: [{ title: "Movimentações — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Movimentações" />
    </Page>
  ),
});
