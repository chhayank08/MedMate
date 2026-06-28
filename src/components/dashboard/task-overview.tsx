import Link from "next/link";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { TASK_PRIORITY_META } from "@/lib/constants";
import { formatDueDate, cn } from "@/lib/utils";
import type { Task } from "@/types";

function TaskRow({ task }: { task: Task }) {
  const priority = TASK_PRIORITY_META[task.priority];
  return (
    <Link
      href="/tasks"
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", {
          "bg-destructive": task.priority === "high",
          "bg-warning": task.priority === "medium",
          "bg-muted-foreground": task.priority === "low",
        })}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatDueDate(task.due_date)}
        </p>
      </div>
      {task.subject && (
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {task.subject}
        </Badge>
      )}
      <Badge className={priority.className}>{priority.label}</Badge>
    </Link>
  );
}

export function TaskOverview({
  todayTasks,
  upcomingTasks,
}: {
  todayTasks: Task[];
  upcomingTasks: Task[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4.5 text-primary" /> Today&apos;s Tasks
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {todayTasks.length ? (
            <div className="-mx-2 space-y-0.5">
              {todayTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing due today"
              description="You're all caught up. Add a task to stay on track."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4.5 text-chart-2" /> Upcoming
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length ? (
            <div className="-mx-2 space-y-0.5">
              {upcomingTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming tasks"
              description="Plan ahead — schedule revisions for the week."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
