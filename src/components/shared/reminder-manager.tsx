"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Bell, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormSelect } from "@/components/shared/form-select";
import {
  useStudyReminders,
  useCreateStudyReminder,
  useToggleStudyReminder,
  useDeleteStudyReminder,
} from "@/hooks/use-reminders";
import type { StudyReminderRow } from "@/types/database.types";

const RECURRENCE_OPTIONS = [
  { value: "hourly", label: "Every hour" },
  { value: "2h", label: "Every 2 hours" },
  { value: "4h", label: "Every 4 hours" },
  { value: "6h", label: "Every 6 hours" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom interval" },
] as const;

type RecurrenceValue = (typeof RECURRENCE_OPTIONS)[number]["value"];

function ReminderBadge({ reminder }: { reminder: StudyReminderRow }) {
  if (reminder.reminder_type === "recurring") {
    const opt = RECURRENCE_OPTIONS.find((o) => o.value === reminder.recurrence);
    const label = reminder.recurrence === "custom"
      ? `Every ${reminder.interval_minutes}m`
      : (opt?.label ?? reminder.recurrence ?? "Recurring");
    return <Badge variant="secondary">{label}</Badge>;
  }
  if (reminder.scheduled_for) {
    return (
      <Badge variant="outline">
        {format(new Date(reminder.scheduled_for), "MMM d, h:mm a")}
      </Badge>
    );
  }
  return null;
}

function CreateReminderDialog() {
  const create = useCreateStudyReminder();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"one_time" | "recurring">("recurring");
  const [recurrence, setRecurrence] = useState<RecurrenceValue>("daily");
  const [intervalMinutes, setIntervalMinutes] = useState("60");
  const [scheduledFor, setScheduledFor] = useState("");

  function reset() {
    setTitle("");
    setType("recurring");
    setRecurrence("daily");
    setIntervalMinutes("60");
    setScheduledFor("");
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Please enter a reminder title.");
      return;
    }
    if (type === "one_time" && !scheduledFor) {
      toast.error("Please set a date and time for the reminder.");
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        reminder_type: type,
        scheduled_for: type === "one_time" ? new Date(scheduledFor).toISOString() : undefined,
        recurrence: type === "recurring" ? recurrence : undefined,
        interval_minutes: recurrence === "custom" ? Number(intervalMinutes) : undefined,
      });
      toast.success("Reminder created.");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create reminder.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger render={<Button size="sm"><Plus className="size-4" />New reminder</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New study reminder</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input
              placeholder="Review pharmacology notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <FormSelect
              value={type}
              onValueChange={(v) => setType(v as "one_time" | "recurring")}
              options={[
                { value: "recurring", label: "Recurring" },
                { value: "one_time", label: "One-time" },
              ]}
            />
          </div>

          {type === "recurring" && (
            <>
              <div className="grid gap-2">
                <Label>Repeat every</Label>
                <FormSelect
                  value={recurrence}
                  onValueChange={(v) => setRecurrence(v as RecurrenceValue)}
                  options={RECURRENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>
              {recurrence === "custom" && (
                <div className="grid gap-2">
                  <Label>Interval (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={10080}
                    value={intervalMinutes}
                    onChange={(e) => setIntervalMinutes(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {type === "one_time" && (
            <div className="grid gap-2">
              <Label>Date and time</Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReminderManager() {
  const { data: reminders, isLoading } = useStudyReminders();
  const toggle = useToggleStudyReminder();
  const del = useDeleteStudyReminder();

  async function handleToggle(r: StudyReminderRow) {
    try {
      await toggle.mutateAsync({ id: r.id, enabled: !r.enabled });
    } catch {
      toast.error("Could not update reminder.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id);
      toast.success("Reminder deleted.");
    } catch {
      toast.error("Could not delete reminder.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="size-4" />
          Study Reminders
        </CardTitle>
        <CreateReminderDialog />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !reminders?.length ? (
          <div className="py-8 text-center">
            <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No study reminders yet.</p>
            <p className="text-xs text-muted-foreground">Create one to get notified when it&apos;s time to study.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <button
                  onClick={() => handleToggle(r)}
                  className="shrink-0 text-primary disabled:opacity-50"
                  disabled={toggle.isPending}
                  aria-label={r.enabled ? "Disable reminder" : "Enable reminder"}
                >
                  {r.enabled ? (
                    <ToggleRight className="size-5 text-primary" />
                  ) : (
                    <ToggleLeft className="size-5 text-muted-foreground" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${!r.enabled ? "text-muted-foreground line-through" : ""}`}>
                    {r.title}
                  </p>
                  <div className="mt-0.5">
                    <ReminderBadge reminder={r} />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(r.id)}
                  disabled={del.isPending}
                  aria-label="Delete reminder"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
