"use client";

import { Pencil, Trash2, Repeat, Bell } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToggleTask, useDeleteTask } from "@/hooks/use-tasks";
import { TASK_PRIORITY_META } from "@/lib/constants";
import { formatDueDate, isOverdue, cn } from "@/lib/utils";
import type { Task } from "@/types";

export function TaskItem({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const completed = task.status === "completed";
  const priority = TASK_PRIORITY_META[task.priority];
  const overdue = !completed && isOverdue(task.due_date);

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40">
      <Checkbox
        checked={completed}
        onCheckedChange={() => toggle.mutate(task)}
        className="mt-1"
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("font-medium leading-snug", completed && "text-muted-foreground line-through")}>
            {task.title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(task)} aria-label="Edit task">
              <Pencil className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Delete task" />}
              >
                <Trash2 className="size-4 text-destructive" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{task.title}&rdquo; will be permanently removed. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() =>
                      del.mutate(task.id, {
                        onSuccess: () => toast.success("Task deleted"),
                        onError: (e) => toast.error(e.message),
                      })
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge className={priority.className}>{priority.label}</Badge>
          {task.subject && <Badge variant="secondary">{task.subject}</Badge>}
          {task.due_date && (
            <span className={cn("text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
              {overdue ? "Overdue · " : ""}
              {formatDueDate(task.due_date)}
            </span>
          )}
          {task.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="size-3" /> {task.recurrence}
            </span>
          )}
          {task.reminder_minutes != null && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Bell className="size-3" /> {task.reminder_minutes}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
