import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PlannerView } from "@/components/planner/planner-view";

export const metadata: Metadata = { title: "Study Planner" };

export default function PlannerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Planner"
        description="Generate an exam-ready plan and keep topics fresh with spaced repetition."
      />
      <PlannerView />
    </div>
  );
}
