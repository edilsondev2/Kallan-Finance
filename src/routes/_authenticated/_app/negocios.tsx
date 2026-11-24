import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/negocios")({
  head: () => pageHead("Negócios", "Finanças e objetivos para pequenos empreendedores no Kallan Finance."),
  component: () => (
    <Page>
      <PageHeader title="Negócios" />
    </Page>
  ),
});
