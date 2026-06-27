"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { reminderTime, reminderMessage, nextOccurrence } from "@/lib/tasks";
import type { TaskFormValues } from "@/lib/validations/task";
import type { Task } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type DB = SupabaseClient<Database>;
const TASKS_KEY = ["tasks"] as const;

/** Map a form submission to a DB insert/update payload. */
function toRow(values: TaskFormValues, userId: string) {
  const due = values.dueDate ? new Date(values.dueDate).toISOString() : null;
  const reminder =
    values.reminderMinutes && values.reminderMinutes.length
      ? Number(values.reminderMinutes)
      : null;
  return {
    user_id: userId,
    title: values.title,
    description: values.description || null,
    subject: values.subject || null,
    domain_id: null,
    subject_id: null,
    status: values.status,
    priority: values.priority,
    due_date: due,
    recurrence: values.recurrence,
    reminder_minutes: reminder,
    completed_at: values.status === "completed" ? new Date().toISOString() : null,
  };
}

/** Recreate the (unsent) reminder notification for a task. */
async function syncReminder(supabase: DB, task: Task) {
  await supabase
    .from("notifications")
    .delete()
    .eq("task_id", task.id)
    .eq("sent", false);

  const fireAt = reminderTime(task.due_date, task.reminder_minutes);
  if (!fireAt) return;

  await supabase.from("notifications").insert({
    user_id: task.user_id,
    task_id: task.id,
    type: "reminder",
    title: "Study reminder",
    message: reminderMessage(task),
    scheduled_for: fireAt,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: async (): Promise<Task[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tasks")
        .insert(toRow(values, user.id))
        .select()
        .single();
      if (error) throw error;
      await syncReminder(supabase, data as Task);
      return data as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TaskFormValues }) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tasks")
        .update(toRow(values, user.id))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await syncReminder(supabase, data as Task);
      return data as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

/** Toggle completion. Completing a recurring task spawns the next occurrence. */
export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Task) => {
      const supabase = createClient();
      const completing = task.status !== "completed";

      const { error } = await supabase
        .from("tasks")
        .update({
          status: completing ? "completed" : "pending",
          completed_at: completing ? new Date().toISOString() : null,
        })
        .eq("id", task.id);
      if (error) throw error;

      if (completing && task.recurrence !== "none" && task.due_date) {
        const next = nextOccurrence(task.due_date, task.recurrence, task.recurrence_interval);
        if (next) {
          const { data: created } = await supabase
            .from("tasks")
            .insert({
              user_id: task.user_id,
              title: task.title,
              description: task.description,
              subject: task.subject,
              domain_id: task.domain_id,
              subject_id: task.subject_id,
              priority: task.priority,
              status: "pending",
              due_date: next,
              recurrence: task.recurrence,
              recurrence_interval: task.recurrence_interval,
              reminder_minutes: task.reminder_minutes,
            })
            .select()
            .single();
          if (created) await syncReminder(supabase, created as Task);
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}
