"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanForm } from "@/components/planner/plan-form";
import { PlanDisplay } from "@/components/planner/plan-display";
import { useActivePlan } from "@/hooks/use-plans";

export function PlannerView() {
  const { data: plan, isLoading } = useActivePlan();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;

  if (plan && !editing) {
    return <PlanDisplay plan={plan} onRegenerate={() => setEditing(true)} />;
  }

  return <PlanForm initial={plan} onDone={() => setEditing(false)} />;
}
