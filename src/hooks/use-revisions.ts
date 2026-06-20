"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { schedule } from "@/lib/spaced-repetition";
import type { Revision } from "@/types";
import type { RevisionRating } from "@/lib/constants";

const REVISIONS_KEY = ["revisions"] as const;

export function useRevisions() {
  return useQuery({
    queryKey: REVISIONS_KEY,
    queryFn: async (): Promise<Revision[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("revisions")
        .select("*")
        .order("next_review", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddRevision() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async ({ subject, topic }: { subject: string; topic?: string }) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("revisions").insert({
        user_id: user.id,
        subject,
        topic: topic || null,
        next_review: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REVISIONS_KEY }),
  });
}

export function useRateRevision() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async ({ revision, rating }: { revision: Revision; rating: RevisionRating }) => {
      const supabase = createClient();
      const next = schedule(
        {
          interval_days: revision.interval_days,
          ease_factor: revision.ease_factor,
          repetitions: revision.repetitions,
        },
        rating,
      );
      const { error } = await supabase
        .from("revisions")
        .update({
          interval_days: next.interval_days,
          ease_factor: next.ease_factor,
          repetitions: next.repetitions,
          next_review: next.next_review,
          last_reviewed: new Date().toISOString(),
          last_rating: rating,
        })
        .eq("id", revision.id);
      if (error) throw error;

      // Count the review as study time.
      if (user) {
        await supabase.from("study_sessions").insert({
          user_id: user.id,
          subject: revision.subject,
          duration_minutes: 5,
          source: "revision",
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REVISIONS_KEY }),
  });
}

export function useDeleteRevision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("revisions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REVISIONS_KEY }),
  });
}
