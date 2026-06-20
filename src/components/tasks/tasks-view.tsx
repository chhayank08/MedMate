"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isToday, isPast } from "date-fns";
import { Plus, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { NotificationPrompt } from "@/components/tasks/notification-prompt";
import { CalendarView } from "@/components/tasks/calendar-view";
import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@/types";

function TaskListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

function TaskList({
  tasks,
  onEdit,
  emptyTitle,
  emptyDescription,
}: {
  tasks: Task[];
  onEdit: (t: Task) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (!tasks.length) {
    return <EmptyState icon={ListChecks} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="space-y-2">
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} onEdit={onEdit} />
      ))}
    </div>
  );
}

export function TasksView() {
  const params = useSearchParams();
  const { data: tasks = [], isLoading } = useTasks();
  // Open the "new task" dialog immediately when arriving via /tasks?new=1.
  const [dialogOpen, setDialogOpen] = useState(() => params.get("new") === "1");
  const [editing, setEditing] = useState<Task | null>(null);

  const { today, upcoming, completed } = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "completed");
    return {
      today: active.filter(
        (t) => !t.due_date || isToday(new Date(t.due_date)) || isPast(new Date(t.due_date)),
      ),
      upcoming: active.filter(
        (t) => t.due_date && !isToday(new Date(t.due_date)) && !isPast(new Date(t.due_date)),
      ),
      completed: tasks.filter((t) => t.status === "completed"),
    };
  }, [tasks]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(t: Task) {
    setEditing(t);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Plan, prioritize and complete your study tasks.">
        <Button onClick={openNew}>
          <Plus className="size-4" /> New task
        </Button>
      </PageHeader>

      <NotificationPrompt />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">
            Today
            {today.length > 0 && <Badge variant="secondary" className="ml-1.5">{today.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcoming.length > 0 && <Badge variant="secondary" className="ml-1.5">{upcoming.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          {isLoading ? (
            <TaskListSkeleton />
          ) : (
            <TaskList
              tasks={today}
              onEdit={openEdit}
              emptyTitle="Nothing for today"
              emptyDescription="You're all caught up. Add a task or enjoy the break."
            />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          {isLoading ? (
            <TaskListSkeleton />
          ) : (
            <TaskList
              tasks={upcoming}
              onEdit={openEdit}
              emptyTitle="No upcoming tasks"
              emptyDescription="Schedule revisions ahead of time to stay on track."
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? (
            <TaskListSkeleton />
          ) : (
            <TaskList
              tasks={completed}
              onEdit={openEdit}
              emptyTitle="No completed tasks yet"
              emptyDescription="Finished tasks will show up here."
            />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : (
            <CalendarView tasks={tasks} onSelectTask={openEdit} />
          )}
        </TabsContent>
      </Tabs>

      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
    </div>
  );
}
