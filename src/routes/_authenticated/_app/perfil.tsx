import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Perfil" />
    </Page>
  ),
});
