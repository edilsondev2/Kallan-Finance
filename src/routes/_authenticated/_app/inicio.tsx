import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/inicio")({
  head: () => ({ meta: [{ title: "Início — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Início" />
    </Page>
  ),
});
