import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kallan/app-shell";

const onboarded = new Set<string>();

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    if (onboarded.has(context.user.id)) return; // checked once per session, not on every tab change
    const { data } = await supabase
      .from("user_settings")
      .select("onboarding_completed")
      .eq("user_id", context.user.id)
      .maybeSingle();
    if (data && !data.onboarding_completed) throw redirect({ to: "/onboarding" });
    if (data) onboarded.add(context.user.id);
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
