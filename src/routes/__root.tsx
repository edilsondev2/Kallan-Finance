import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/modules/auth/auth-context";
import { KallanMark } from "@/components/kallan/logo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <KallanMark className="mx-auto size-12" />
        <h1 className="mt-6 font-display text-6xl font-semibold text-gradient">404</h1>
        <h2 className="mt-3 text-lg font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">O endereço que você abriu não existe ou foi movido.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="press inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <KallanMark className="mx-auto size-12" />
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Algo deu errado. Tente novamente ou volte ao início.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="press inline-flex h-11 items-center justify-center rounded-full border border-border-strong px-5 text-sm font-medium text-foreground"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

/** Applies the saved theme before first paint (no flash). "auto" = follow the device. */
const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('kf-theme');var r=document.documentElement;if(p==='light'||p==='dark'){r.setAttribute('data-theme',p)}var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d)}catch(e){}})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Kallan" },
      { name: "theme-color", content: "#F4F4F5", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#050506", media: "(prefers-color-scheme: dark)" },
      { title: "Kallan Finance — Seu dinheiro. Seu negócio. Seu próximo passo." },
      {
        name: "description",
        content: "Plataforma de inteligência financeira: suas finanças, seu negócio e uma comunidade de empreendedores em um só lugar.",
      },
      { name: "author", content: "Kallan Finance" },
      { property: "og:title", content: "Kallan Finance" },
      { property: "og:description", content: "Seu dinheiro. Seu negócio. Seu próximo passo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=DM+Sans:opsz,wght@9..40,400..700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [{ children: THEME_INIT_SCRIPT }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
