import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatMinutes } from "@/lib/utils";
import type { DashboardData } from "@/lib/queries/dashboard";

export function DailyProgress({ progress }: { progress: DashboardData["progress"] }) {
  const studyPct = progress.dailyGoalMinutes
    ? Math.min(100, Math.round((progress.studiedTodayMinutes / progress.dailyGoalMinutes) * 100))
    : 0;
  const taskTotal = progress.dueToday + progress.completedToday;
  const taskPct = taskTotal
    ? Math.round((progress.completedToday / taskTotal) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4.5 text-chart-4" /> Daily Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Study time</span>
            <span className="text-muted-foreground">
              {formatMinutes(progress.studiedTodayMinutes)} / {formatMinutes(progress.dailyGoalMinutes)}
            </span>
          </div>
          <Progress value={studyPct} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tasks completed</span>
            <span className="text-muted-foreground">
              {progress.completedToday} / {taskTotal || 0}
            </span>
          </div>
          <Progress value={taskPct} />
        </div>
      </CardContent>
    </Card>
  );
}
