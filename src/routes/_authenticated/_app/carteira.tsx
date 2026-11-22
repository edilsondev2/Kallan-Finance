import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/carteira")({
  head: () => ({ meta: [{ title: "Carteira — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Carteira" />
    </Page>
  ),
});
