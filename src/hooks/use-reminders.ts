"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { StudyReminderRow } from "@/types/database.types";

const REMINDER_KEY = ["study-reminders"] as const;

export function useStudyReminders() {
  const { data: user } = useUser();
  return useQuery({
    queryKey: REMINDER_KEY,
    enabled: !!user,
    queryFn: async (): Promise<StudyReminderRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("study_reminders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

type ReminderInsert = {
  title: string;
  reminder_type: "one_time" | "recurring";
  scheduled_for?: string;
  recurrence?: StudyReminderRow["recurrence"];
  interval_minutes?: number;
};

export function useCreateStudyReminder() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async (input: ReminderInsert) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");

      // Compute next_fire_at
      let next_fire_at: string | undefined;
      if (input.reminder_type === "one_time" && input.scheduled_for) {
        next_fire_at = input.scheduled_for;
      } else if (input.reminder_type === "recurring") {
        next_fire_at = computeNextFireAt(input.recurrence, input.interval_minutes);
      }

      const { error } = await supabase.from("study_reminders").insert({
        user_id: user.id,
        title: input.title,
        reminder_type: input.reminder_type,
        scheduled_for: input.scheduled_for ?? null,
        recurrence: input.recurrence ?? null,
        interval_minutes: input.interval_minutes ?? null,
        next_fire_at: next_fire_at ?? null,
        enabled: true,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REMINDER_KEY }),
  });
}

export function useToggleStudyReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("study_reminders")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REMINDER_KEY }),
  });
}

export function useDeleteStudyReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("study_reminders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: REMINDER_KEY }),
  });
}

function computeNextFireAt(
  recurrence?: StudyReminderRow["recurrence"],
  intervalMinutes?: number,
): string {
  const now = new Date();
  const minutesMap: Record<string, number> = {
    hourly: 60,
    "2h": 120,
    "4h": 240,
    "6h": 360,
    daily: 1440,
    weekly: 10080,
    monthly: 43200,
  };
  const mins = recurrence === "custom"
    ? (intervalMinutes ?? 60)
    : minutesMap[recurrence ?? "daily"] ?? 1440;
  return new Date(now.getTime() + mins * 60 * 1000).toISOString();
}
