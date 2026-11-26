import { Briefcase, Home, Landmark, Receipt, Settings, Sparkles, Target, UserRound, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };

/** Main areas. On mobile the first four sit in the tab bar (Kallan has the centre button); Perfil is the avatar. */
export const PRIMARY_NAV: NavItem[] = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/carteira", label: "Contas", icon: Wallet },
  { to: "/movimentacoes", label: "Extrato", icon: Receipt },
  { to: "/metas", label: "Metas", icon: Target },
  { to: "/perfil", label: "Perfil", icon: UserRound },
];

/** Secondary areas, shown in the desktop sidebar. */
export const MORE_NAV: NavItem[] = [
  { to: "/inteligencia", label: "Diagnósticos", icon: Sparkles },
  { to: "/negocios", label: "Negócios", icon: Briefcase },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/open-finance", label: "Open Finance", icon: Landmark },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];
