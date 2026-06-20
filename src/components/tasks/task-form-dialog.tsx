"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/shared/form-select";
import { SubjectCombobox } from "@/components/shared/subject-combobox";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { taskFormSchema, type TaskFormValues } from "@/lib/validations/task";
import {
  TASK_STATUS,
  TASK_PRIORITY,
  RECURRENCE,
  TASK_STATUS_META,
  TASK_PRIORITY_META,
} from "@/lib/constants";
import { REMINDER_OPTIONS } from "@/lib/tasks";
import type { Task } from "@/types";

const STATUS_OPTIONS = TASK_STATUS.map((v) => ({ value: v, label: TASK_STATUS_META[v].label }));
const PRIORITY_OPTIONS = TASK_PRIORITY.map((v) => ({ value: v, label: TASK_PRIORITY_META[v].label }));
const RECURRENCE_OPTIONS = RECURRENCE.map((v) => ({
  value: v,
  label: v === "none" ? "Does not repeat" : v.charAt(0).toUpperCase() + v.slice(1),
}));

function toDefaults(task?: Task | null): TaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    subject: task?.subject ?? "",
    status: task?.status ?? "pending",
    priority: task?.priority ?? "medium",
    dueDate: task?.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : "",
    recurrence: task?.recurrence ?? "none",
    reminderMinutes: task?.reminder_minutes != null ? String(task.reminder_minutes) : "",
  };
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isEdit = Boolean(task);
  const [customReminderMinutes, setCustomReminderMinutes] = useState("");

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: toDefaults(task),
  });

  useEffect(() => {
    if (open) {
      form.reset(toDefaults(task));
      setCustomReminderMinutes("");
    }
  }, [open, task, form]);

  async function onSubmit(values: TaskFormValues) {
    try {
      if (isEdit && task) {
        await updateTask.mutateAsync({ id: task.id, values });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync(values);
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const submitting = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details of your study task." : "Add a study task to stay on track."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Revise cardiac cycle" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Focus on Wiggers diagram…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <SubjectCombobox value={field.value ?? ""} onChange={field.onChange} placeholder="Cardiology" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={PRIORITY_OPTIONS}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={STATUS_OPTIONS}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat</FormLabel>
                    <FormSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={RECURRENCE_OPTIONS}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reminderMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder</FormLabel>
                    <FormSelect
                      value={field.value ?? ""}
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v !== "custom") setCustomReminderMinutes("");
                      }}
                      options={REMINDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    />
                    {field.value === "custom" && (
                      <Input
                        type="number"
                        min={1}
                        max={10080}
                        placeholder="Minutes before due"
                        value={customReminderMinutes}
                        onChange={(e) => {
                          setCustomReminderMinutes(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        className="mt-1"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? "Save changes" : "Create task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
