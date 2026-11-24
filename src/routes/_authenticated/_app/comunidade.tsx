import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader } from "@/components/kallan/page";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/comunidade")({
  head: () => pageHead("Comunidade", "Conexões e oportunidades entre empreendedores no Kallan Finance."),
  component: () => (
    <Page>
      <PageHeader title="Comunidade" />
    </Page>
  ),
});
