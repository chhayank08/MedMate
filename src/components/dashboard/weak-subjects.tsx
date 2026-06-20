import Link from "next/link";
import { TriangleAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { SubjectAnalytics } from "@/types";

export function WeakSubjects({ subjects }: { subjects: SubjectAnalytics[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-4.5 text-warning" /> Weak Subjects
        </CardTitle>
        <Button variant="ghost" size="sm" render={<Link href="/analytics" />}>
          Details
        </Button>
      </CardHeader>
      <CardContent>
        {subjects.length ? (
          <div className="space-y-4">
            {subjects.map((s) => {
              const acc = Math.round(Number(s.accuracy ?? 0));
              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">{acc}% accuracy</span>
                  </div>
                  <Progress value={acc} />
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No weak spots detected"
            description="Take a few quizzes and MedMate will flag subjects that need work."
          />
        )}
      </CardContent>
    </Card>
  );
}
