import Link from "next/link";
import { Plus, Brain, FileText, CalendarRange, LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { label: "Add Task", href: "/tasks?new=1", icon: Plus, accent: "text-chart-1" },
  { label: "Generate Quiz", href: "/quizzes/new", icon: Brain, accent: "text-chart-2" },
  { label: "Generate Summary", href: "/summaries/new", icon: FileText, accent: "text-chart-3" },
  { label: "Create Study Plan", href: "/planner", icon: CalendarRange, accent: "text-chart-4" },
  { label: "View Analytics", href: "/analytics", icon: LineChart, accent: "text-chart-5" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {ACTIONS.map(({ label, href, icon: Icon, accent }) => (
        <Link key={href} href={href}>
          <Card className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
            <span className={cn("flex size-10 items-center justify-center rounded-xl bg-accent", accent)}>
              <Icon className="size-5" />
            </span>
            <span className="text-sm font-medium">{label}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
