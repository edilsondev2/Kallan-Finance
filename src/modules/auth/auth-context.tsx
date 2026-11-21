import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; user: User | null; ready: boolean };

const AuthContext = createContext<AuthState>({ session: null, user: null, ready: false });

/** Single app-wide auth listener. Keeps router + query cache in sync with identity changes. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ session: null, user: null, ready: false });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, user: session?.user ?? null, ready: true });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    void supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, user: data.session?.user ?? null, ready: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** For pages under the authenticated layout: the user is guaranteed by the route guard. */
export function useUserId(): string {
  const { user } = useAuth();
  return user?.id ?? "";
}

export async function signOutEverywhere(
  queryClient: ReturnType<typeof useQueryClient>,
  navigate: (opts: { to: "/auth"; replace: boolean }) => void,
) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  navigate({ to: "/auth", replace: true });
}
