import { Briefcase, Home, Sparkles, UserRound, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };

/** The five primary areas of the app. */
export const PRIMARY_NAV: NavItem[] = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/inteligencia", label: "Inteligência", icon: Sparkles },
  { to: "/negocios", label: "Negócios", icon: Briefcase },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/perfil", label: "Perfil", icon: UserRound },
];
