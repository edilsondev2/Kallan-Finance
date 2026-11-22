import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kallan/app-shell";

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase
      .from("user_settings")
      .select("onboarding_completed")
      .eq("user_id", context.user.id)
      .maybeSingle();
    if (data && !data.onboarding_completed) throw redirect({ to: "/onboarding" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
