"use client";

import Link from "next/link";
import { Brain, Trash2, Plus, Play } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EmptyState } from "@/components/shared/empty-state";
import { useQuizzes, useDeleteQuiz, type QuizListItem } from "@/hooks/use-quizzes";
import { formatDate, cn } from "@/lib/utils";

function bestScore(quiz: QuizListItem): number | null {
  if (!quiz.quiz_attempts?.length) return null;
  return Math.round(Math.max(...quiz.quiz_attempts.map((a) => Number(a.accuracy))));
}

export function QuizzesList() {
  const { data: quizzes = [], isLoading } = useQuizzes();
  const del = useDeleteQuiz();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!quizzes.length) {
    return (
      <EmptyState
        icon={Brain}
        title="No quizzes yet"
        description="Generate your first quiz from your notes and start testing yourself."
        action={
          <Button asChild>
            <Link href="/quizzes/new">
              <Plus className="size-4" /> New quiz
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((q) => {
        const best = bestScore(q);
        const attempts = q.quiz_attempts?.length ?? 0;
        return (
          <Card key={q.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{q.title}</CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Delete" />}>
                    <Trash2 className="size-4 text-destructive" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the quiz and its attempt history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() =>
                          del.mutate(q.id, {
                            onSuccess: () => toast.success("Quiz deleted"),
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
              <div className="flex flex-wrap items-center gap-1.5">
                {q.subject && <Badge variant="outline">{q.subject}</Badge>}
                <Badge variant="secondary">{q.difficulty}</Badge>
                <Badge variant="secondary">{q.num_questions} Q</Badge>
                {q.timed && <Badge variant="secondary">Timed</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {attempts > 0 ? (
                  <span>
                    Best score{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        (best ?? 0) >= 80 ? "text-success" : (best ?? 0) >= 60 ? "text-warning" : "text-destructive",
                      )}
                    >
                      {best}%
                    </span>{" "}
                    · {attempts} attempt{attempts > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span>Not attempted yet</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(q.created_at)}</span>
                <Button size="sm" asChild>
                  <Link href={`/quizzes/${q.id}`}>
                    <Play className="size-4" /> {attempts > 0 ? "Retake" : "Start"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
