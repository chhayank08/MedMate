"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { Summary } from "@/types";
import type { SummaryType } from "@/lib/constants";

const SUMMARIES_KEY = ["summaries"] as const;

export function useSummaries() {
  return useQuery({
    queryKey: SUMMARIES_KEY,
    queryFn: async (): Promise<Summary[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveSummary() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async (input: {
      type: SummaryType;
      title: string;
      subject?: string;
      sourceText: string;
      content: string;
    }) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("summaries")
        .insert({
          user_id: user.id,
          type: input.type,
          title: input.title,
          subject: input.subject || null,
          domain_id: null,
          subject_id: null,
          source_text: input.sourceText,
          content: input.content,
          model: process.env.NEXT_PUBLIC_OPENROUTER_MODEL ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SUMMARIES_KEY }),
  });
}

export function useDeleteSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("summaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SUMMARIES_KEY }),
  });
}
