"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { StudyPlan } from "@/types";
import type { GeneratedPlan } from "@/lib/validations/ai";

const PLAN_KEY = ["active-plan"] as const;

export type StudyPlanWithData = Omit<StudyPlan, "plan"> & { plan: GeneratedPlan };

export function useActivePlan() {
  return useQuery({
    queryKey: PLAN_KEY,
    queryFn: async (): Promise<StudyPlanWithData | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .order("active", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as StudyPlanWithData | null) ?? null;
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("study_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PLAN_KEY }),
  });
}
