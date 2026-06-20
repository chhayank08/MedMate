import Link from "next/link";
import { Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { fromNow, cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/queries/dashboard";

function accuracyTone(accuracy: number) {
  if (accuracy >= 80) return "bg-success/15 text-success";
  if (accuracy >= 60) return "bg-warning/15 text-warning";
  return "bg-destructive/15 text-destructive";
}

export function RecentQuizzes({
  attempts,
}: {
  attempts: DashboardData["recentAttempts"];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-4.5 text-chart-2" /> Recent Quiz Scores
        </CardTitle>
        <Button variant="ghost" size="sm" render={<Link href="/quizzes" />}>
          History
        </Button>
      </CardHeader>
      <CardContent>
        {attempts.length ? (
          <div className="space-y-3">
            {attempts.map((a) => {
              const acc = Math.round(Number(a.accuracy));
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {a.quiz?.title ?? "Quiz"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.quiz?.subject ? `${a.quiz.subject} · ` : ""}
                      {a.score}/{a.total} · {fromNow(a.completed_at)}
                    </p>
                  </div>
                  <Badge className={cn(accuracyTone(acc))}>{acc}%</Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Brain}
            title="No quizzes yet"
            description="Generate a quiz from your notes to start tracking scores."
            action={
              <Button size="sm" render={<Link href="/quizzes/new" />}>
                Generate a quiz
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
