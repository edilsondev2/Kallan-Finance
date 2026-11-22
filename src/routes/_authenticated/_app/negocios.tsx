import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/negocios")({
  head: () => ({ meta: [{ title: "Negócios — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Negócios" />
    </Page>
  ),
});
