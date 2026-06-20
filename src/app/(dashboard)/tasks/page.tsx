import { Suspense } from "react";
import type { Metadata } from "next";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksView />
    </Suspense>
  );
}
