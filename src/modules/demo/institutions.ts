import type { OpenFinanceInstitution } from "../open-finance/provider";

/** Illustrative institutions used only by the connection preview. They are not real, and nothing connects to them. */
export const DEMO_INSTITUTIONS: OpenFinanceInstitution[] = [
  { id: "demo-banco-exemplo", name: "Banco Exemplo", products: ["Contas", "Cartões", "Investimentos"] },
  { id: "demo-cooperativa-exemplo", name: "Cooperativa Exemplo", products: ["Contas", "Cartões", "Investimentos"] },
  { id: "demo-banco-digital-exemplo", name: "Banco Digital Exemplo", products: ["Contas", "Cartões"] },
  { id: "demo-corretora-exemplo", name: "Corretora Exemplo", products: ["Investimentos"] },
  { id: "demo-banco-horizonte", name: "Banco Horizonte (exemplo)", products: ["Contas", "Cartões"] },
  { id: "demo-cartoes-exemplo", name: "Cartões Exemplo", products: ["Cartões"] },
  { id: "demo-banco-aurora", name: "Banco Aurora (exemplo)", products: ["Contas", "Investimentos"] },
  { id: "demo-cooperativa-vale", name: "Cooperativa Vale (exemplo)", products: ["Contas", "Cartões", "Investimentos"] },
];
