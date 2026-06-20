"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { Profile } from "@/types";

const PROFILE_KEY = ["profile"] as const;

export function useProfile() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: PROFILE_KEY,
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async (input: Partial<Profile>) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...input });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async (input: Partial<Profile> & { onboarding_complete: true }) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ ...input, onboarding_complete: true })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE_KEY }),
  });
}
