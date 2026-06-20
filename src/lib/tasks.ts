import { addDays, addMonths, addWeeks, subMinutes } from "date-fns";
import type { Task } from "@/types";
import type { Recurrence } from "@/lib/constants";
import { formatDueDate } from "@/lib/utils";

/** Next occurrence date for a recurring task, or null if non-recurring. */
export function nextOccurrence(
  dueDate: string,
  recurrence: Recurrence,
  interval = 1,
): string | null {
  const d = new Date(dueDate);
  switch (recurrence) {
    case "daily":
      return addDays(d, interval).toISOString();
    case "weekly":
      return addWeeks(d, interval).toISOString();
    case "monthly":
      return addMonths(d, interval).toISOString();
    default:
      return null;
  }
}

/** Friendly, context-aware reminder copy. */
export function reminderMessage(task: Pick<Task, "title" | "subject" | "due_date" | "reminder_minutes">): string {
  const subject = task.subject ? `${task.subject}: ` : "";
  const mins = task.reminder_minutes ?? 0;
  const when =
    mins >= 60
      ? `${Math.round(mins / 60)} hour${mins >= 120 ? "s" : ""}`
      : `${mins} minutes`;
  return `${subject}"${task.title}" is due in ${when} (${formatDueDate(task.due_date)}).`;
}

/** When a reminder should fire = due_date − reminder_minutes. Null if not applicable. */
export function reminderTime(
  dueDate: string | null,
  reminderMinutes: number | null | undefined,
): string | null {
  if (!dueDate || reminderMinutes == null) return null;
  return subMinutes(new Date(dueDate), reminderMinutes).toISOString();
}

export const REMINDER_OPTIONS = [
  { label: "No reminder", value: "" },
  { label: "15 minutes before", value: "15" },
  { label: "30 minutes before", value: "30" },
  { label: "1 hour before", value: "60" },
  { label: "2 hours before", value: "120" },
  { label: "4 hours before", value: "240" },
  { label: "1 day before", value: "1440" },
  { label: "Custom…", value: "custom" },
] as const;
