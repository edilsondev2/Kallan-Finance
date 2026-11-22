import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/inteligencia")({
  head: () => ({ meta: [{ title: "Kallan Intelligence — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Kallan Intelligence" />
    </Page>
  ),
});
