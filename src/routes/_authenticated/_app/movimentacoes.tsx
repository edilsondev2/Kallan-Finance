import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Transactions } from "@/modules/finance/components/transactions";
import { financeQueryOptions } from "@/modules/finance/queries";
import { FinanceError, FinanceNotFound, FinancePending } from "@/modules/finance/components/route-states";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/_authenticated/_app/movimentacoes")({
  validateSearch: z.object({ q:z.string().optional(), category:z.string().optional(), type:z.string().optional(), from:z.string().optional(), until:z.string().optional(), institution:z.string().optional(), min:z.string().optional(), max:z.string().optional() }),
  head: () => pageHead("Movimentações", "Pesquise entradas, saídas e registros por data, valor, categoria e instituição."),
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQueryOptions(context.user.id)),
  errorComponent: FinanceError,
  notFoundComponent: FinanceNotFound,
  pendingComponent: FinancePending,
  component: MovimentacoesPage,
});

function MovimentacoesPage() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  return <Transactions filters={filters} onFilter={patch => void navigate({search:previous=>({...previous,...patch}),replace:true})}/>;
}
