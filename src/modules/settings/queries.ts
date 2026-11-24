import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useUserId } from "@/modules/auth/auth-context";

export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MainGoal = Database["public"]["Enums"]["main_goal"];

export function useSettings() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["settings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      // Self-heal: settings row missing (e.g. legacy account)
      const { data: created, error: e2 } = await supabase
        .from("user_settings")
        .insert({ user_id: userId })
        .select("*")
        .single();
      if (e2) throw e2;
      return created;
    },
  });
}

export function useUpdateSettings() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<UserSettings, "user_id" | "plan" | "updated_at">>) => {
      const { data, error } = await supabase
        .from("user_settings")
        .update(patch)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["settings", userId], data);
      void qc.invalidateQueries({ queryKey: ["account-panel", userId] });
    },
  });
}

/** Global "hide values" preference. */
export function useHideValues(): [boolean, () => void] {
  const { data } = useSettings();
  const update = useUpdateSettings();
  const hidden = data?.hide_values ?? false;
  return [hidden, () => update.mutate({ hide_values: !hidden })];
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["profile", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("Perfil não disponível.");
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyProfile() {
  const userId = useUserId();
  return useProfile(userId || undefined);
}

export function useUpdateProfile() {
  const userId = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, "display_name" | "avatar_url" | "bio" | "city" | "segment">>) => {
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["profile", userId], data);
      void qc.invalidateQueries({ queryKey: ["account-panel", userId] });
    },
  });
}

export function useIsModerator() {
  const userId = useUserId();
  return useQuery({
    queryKey: ["is-moderator", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_moderator", { _user_id: userId });
      if (error) return false;
      return !!data;
    },
  });
}
