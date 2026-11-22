/**
 * Illustrative dataset shown ONLY when the user has no real financial data and keeps
 * "show demo" enabled. Never persisted and never mixed with real records.
 * Every screen that renders it must show <DemoBadge />.
 */
import { toISODate } from "@/lib/format";
import type { FinanceData, Transaction } from "@/modules/finance/types";

const DEMO_USER = "00000000-0000-0000-0000-000000000000";

function cat(id: string, name: string, icon: string, color: string, kind: "expense" | "income") {
  return { id, name, icon, color, kind, scope: "personal" as const, user_id: null, business_id: null, created_at: "" };
}

export const DEMO_CATEGORIES = [
  cat("demo-food", "Alimentação", "utensils", "amber", "expense"),
  cat("demo-home", "Moradia", "home", "sky", "expense"),
  cat("demo-transport", "Transporte", "car", "violet", "expense"),
  cat("demo-shop", "Compras", "shopping-bag", "pink", "expense"),
  cat("demo-health", "Saúde", "heart-pulse", "rose", "expense"),
  cat("demo-fun", "Lazer", "party-popper", "orange", "expense"),
  cat("demo-subs", "Assinaturas", "repeat", "cyan", "expense"),
  cat("demo-edu", "Educação", "graduation-cap", "indigo", "expense"),
  cat("demo-salary", "Salário", "briefcase", "emerald", "income"),
  cat("demo-free", "Freelance", "laptop", "lime", "income"),
];

type Seed = [day: number, desc: string, amount: number, dir: "in" | "out", type: Transaction["type"], cat: string, inst: string];

const MONTH_SEEDS: Seed[][] = [
  [
    [1, "Salário", 7200, "in", "income", "demo-salary", "Banco Exemplo"],
    [1, "Aluguel", 1850, "out", "expense", "demo-home", "Banco Exemplo"],
    [2, "Supermercado", 612.4, "out", "card_purchase", "demo-food", "Cartão Exemplo"],
    [3, "Streaming de vídeo", 44.9, "out", "card_purchase", "demo-subs", "Cartão Exemplo"],
    [4, "Aplicativo de transporte", 86.3, "out", "card_purchase", "demo-transport", "Cartão Exemplo"],
    [6, "Restaurante", 148, "out", "card_purchase", "demo-food", "Cartão Exemplo"],
    [9, "Projeto freelance", 1400, "in", "income", "demo-free", "Banco Exemplo"],
    [10, "Farmácia", 92.5, "out", "expense", "demo-health", "Banco Exemplo"],
    [12, "Delivery", 76.9, "out", "card_purchase", "demo-food", "Cartão Exemplo"],
    [15, "Academia", 119.9, "out", "expense", "demo-health", "Banco Exemplo"],
    [16, "Curso online", 197, "out", "card_purchase", "demo-edu", "Cartão Exemplo"],
    [17, "Cinema", 64, "out", "card_purchase", "demo-fun", "Cartão Exemplo"],
  ],
  [
    [1, "Salário", 7200, "in", "income", "demo-salary", "Banco Exemplo"],
    [1, "Aluguel", 1850, "out", "expense", "demo-home", "Banco Exemplo"],
    [8, "Supermercado", 480.1, "out", "card_purchase", "demo-food", "Cartão Exemplo"],
    [3, "Streaming de vídeo", 44.9, "out", "card_purchase", "demo-subs", "Cartão Exemplo"],
    [11, "Aplicativo de transporte", 132.7, "out", "card_purchase", "demo-transport", "Cartão Exemplo"],
    [14, "Loja de roupas", 389.9, "out", "card_purchase", "demo-shop", "Cartão Exemplo"],
    [15, "Academia", 119.9, "out", "expense", "demo-health", "Banco Exemplo"],
    [19, "Show", 220, "out", "card_purchase", "demo-fun", "Cartão Exemplo"],
    [22, "Conta de luz", 210.4, "out", "payment", "demo-home", "Banco Exemplo"],
    [25, "Restaurante", 96, "out", "card_purchase", "demo-food", "Cartão Exemplo"],
  ],
  [
    [1, "Salário", 7200, "in", "income", "demo-salary", "Banco Exemplo"],
    [1, "Aluguel", 1850, "out", "expense", "demo-home", "Banco Exemplo"],
    [9, "Supermercado", 530.6, "out", "card_purchase", "demo-food", "Cartão Exemplo"],
    [3, "Streaming de vídeo", 44.9, "out", "card_purchase", "demo-subs", "Cartão Exemplo"],
    [15, "Academia", 119.9, "out", "expense", "demo-health", "Banco Exemplo"],
    [18, "Eletrônicos", 899, "out", "card_purchase", "demo-shop", "Cartão Exemplo"],
    [22, "Conta de luz", 198.2, "out", "payment", "demo-home", "Banco Exemplo"],
  ],
];

export function buildDemoData(today: Date = new Date()): FinanceData {
  const transactions: Transaction[] = [];
  MONTH_SEEDS.forEach((seeds, offset) => {
    const base = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const lastDay = offset === 0 ? today.getDate() : new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    seeds.forEach(([day, desc, amount, dir, type, catId, inst], i) => {
      if (day > lastDay) return;
      const d = new Date(base.getFullYear(), base.getMonth(), day);
      transactions.push({
        id: `demo-tx-${offset}-${i}`,
        user_id: DEMO_USER,
        account_id: null,
        card_id: null,
        source: "manual",
        external_id: null,
        occurred_on: toISODate(d),
        description: desc,
        amount,
        direction: dir,
        type,
        category_id: catId,
        institution_name: inst,
        notes: null,
        created_at: d.toISOString(),
        updated_at: d.toISOString(),
      });
    });
  });
  transactions.sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  const iso = today.toISOString();
  return {
    accounts: [
      { id: "demo-acc-1", user_id: DEMO_USER, connection_id: null, source: "manual", external_id: null, type: "checking", name: "Conta principal", institution_name: "Banco Exemplo", balance: 4820.35, currency: "BRL", balance_updated_at: iso, created_at: iso, updated_at: iso },
      { id: "demo-acc-2", user_id: DEMO_USER, connection_id: null, source: "manual", external_id: null, type: "savings", name: "Reserva", institution_name: "Banco Exemplo", balance: 6300, currency: "BRL", balance_updated_at: iso, created_at: iso, updated_at: iso },
    ],
    cards: [
      { id: "demo-card-1", user_id: DEMO_USER, connection_id: null, source: "manual", external_id: null, name: "Cartão Exemplo", institution_name: "Cartão Exemplo", brand: "Visa", last_four: "4821", credit_limit: 8000, available_limit: 6771.6, closing_day: 3, due_day: 10, created_at: iso, updated_at: iso },
    ],
    invoices: [
      { id: "demo-inv-1", user_id: DEMO_USER, card_id: "demo-card-1", source: "manual", external_id: null, reference_month: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)), due_date: toISODate(new Date(today.getFullYear(), today.getMonth() + 1, 10)), amount: 1228.4, status: "open", created_at: iso, updated_at: iso },
    ],
    investments: [
      { id: "demo-inv-a", user_id: DEMO_USER, connection_id: null, source: "manual", external_id: null, name: "Tesouro Selic", kind: "tesouro", institution_name: "Corretora Exemplo", amount: 12450.8, invested_amount: 11800, position_date: toISODate(today), created_at: iso, updated_at: iso },
      { id: "demo-inv-b", user_id: DEMO_USER, connection_id: null, source: "manual", external_id: null, name: "CDB liquidez diária", kind: "renda_fixa", institution_name: "Banco Exemplo", amount: 5200, invested_amount: 5000, position_date: toISODate(today), created_at: iso, updated_at: iso },
    ],
    transactions,
    categories: DEMO_CATEGORIES,
    snapshots: [],
    goals: [
      { id: "demo-goal-1", user_id: DEMO_USER, business_id: null, scope: "personal", title: "Reserva de emergência", target_amount: 20000, current_amount: 16800, deadline: null, status: "active", icon: "shield", completed_at: null, created_at: iso, updated_at: iso },
    ],
  };
}
