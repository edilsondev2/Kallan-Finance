import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "@/modules/auth/welcome";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/")({
  head: () => pageHead("Kallan Finance", "Seu dinheiro. Seu negócio. Seu próximo passo. Organize suas finanças e acompanhe seus objetivos."),
  component: WelcomePage,
});
