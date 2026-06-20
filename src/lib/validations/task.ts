import { z } from "zod";
import { TASK_STATUS, TASK_PRIORITY, RECURRENCE } from "@/lib/constants";

export const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  subject: z.string().max(80).optional().or(z.literal("")),
  // No zod .default() on these — RHF supplies defaults via defaultValues, and
  // keeping them required keeps the schema's input/output types identical
  // (which the RHF + zodResolver typing needs).
  status: z.enum(TASK_STATUS),
  priority: z.enum(TASK_PRIORITY),
  dueDate: z.string().optional().or(z.literal("")), // datetime-local string
  recurrence: z.enum(RECURRENCE),
  // The reminder <select> yields "" (none) or a minutes string. Kept as a
  // string here (no transform) so RHF input/output types stay aligned; the
  // data layer (toRow) converts it to number | null.
  reminderMinutes: z.string().optional(),
});

export type TaskFormValues = z.output<typeof taskFormSchema>;
