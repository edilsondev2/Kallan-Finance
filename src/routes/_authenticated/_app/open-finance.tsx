import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";

export const Route = createFileRoute("/_authenticated/_app/open-finance")({
  head: () => ({ meta: [{ title: "Open Finance — Kallan Finance" }] }),
  component: () => (
    <Page>
      <PageHeader title="Open Finance" />
    </Page>
  ),
});
