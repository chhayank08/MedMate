"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Markdown } from "@/components/shared/markdown";
import { useSaveAttempt } from "@/hooks/use-quizzes";
import { formatDuration, cn } from "@/lib/utils";
import type { QuizWithQuestions, AttemptAnswer, Question } from "@/types";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

function gradeShort(given: string, correct: string) {
  if (!given.trim()) return false;
  const g = norm(given);
  const c = norm(correct);
  return g === c || c.includes(g) || g.includes(c);
}

function isCorrect(q: Question, given: string) {
  if (!given) return false;
  if (q.type === "short_answer") return gradeShort(given, q.correct_answer);
  return norm(given) === norm(q.correct_answer);
}

export function QuizRunner({ quiz }: { quiz: QuizWithQuestions }) {
  const questions = quiz.questions;
  const saveAttempt = useSaveAttempt();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"taking" | "results">("taking");
  const [remaining, setRemaining] = useState(quiz.time_limit_sec ?? 0);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const current = questions[index];
  const answered = Object.values(answers).filter(Boolean).length;

  const submit = useCallback(async () => {
    if (phase === "results" || saveAttempt.isPending) return;
    const graded: AttemptAnswer[] = questions.map((q) => ({
      questionId: q.id,
      given: answers[q.id] ?? "",
      correct: isCorrect(q, answers[q.id] ?? ""),
    }));
    const timeTakenSec = Math.round((Date.now() - startedAt.current) / 1000);
    try {
      await saveAttempt.mutateAsync({ quiz, answers: graded, timeTakenSec });
      setPhase("results");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save attempt.");
    }
  }, [answers, phase, questions, quiz, saveAttempt]);

  // Countdown for timed quizzes.
  useEffect(() => {
    if (!quiz.timed || phase !== "taking") return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [quiz.timed, phase]);

  // Auto-submit when the timer runs out (external timer driving an action).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (quiz.timed && phase === "taking" && remaining === 0) submit();
  }, [quiz.timed, phase, remaining, submit]);

  if (phase === "results") {
    return <QuizResults quiz={quiz} answers={answers} onRetake={() => {
      setAnswers({});
      setIndex(0);
      setRemaining(quiz.time_limit_sec ?? 0);
      startedAt.current = Date.now();
      setPhase("taking");
    }} />;
  }

  function setAnswer(value: string) {
    setAnswers((a) => ({ ...a, [current.id]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="mb-1 text-sm text-muted-foreground">
            Question {index + 1} of {questions.length} · {answered} answered
          </p>
          <Progress value={((index + 1) / questions.length) * 100} />
        </div>
        {quiz.timed && quiz.time_limit_sec && (
          <div className="flex flex-col items-center gap-1">
            <Badge className={cn("gap-1", remaining <= 30 && "bg-destructive/15 text-destructive")}>
              <Clock className="size-3.5" /> {formatDuration(remaining)}
            </Badge>
            {/* Timer progress bar — turns red when under 20% remaining */}
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  remaining / quiz.time_limit_sec > 0.2 ? "bg-primary" : "bg-destructive"
                )}
                style={{ width: `${Math.max(0, (remaining / quiz.time_limit_sec) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-snug">{current.prompt}</CardTitle>
        </CardHeader>
        <CardContent>
          {current.type === "short_answer" ? (
            <Textarea
              rows={4}
              placeholder="Type your answer…"
              value={answers[current.id] ?? ""}
              onChange={(e) => setAnswer(e.target.value)}
            />
          ) : (
            <RadioGroup value={answers[current.id] ?? ""} onValueChange={(v) => setAnswer(String(v))} className="space-y-2">
              {(current.options as string[] | null ?? []).map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50",
                    answers[current.id] === opt && "border-primary bg-accent",
                  )}
                >
                  <RadioGroupItem value={opt} />
                  {opt}
                </label>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={saveAttempt.isPending}>
            {saveAttempt.isPending && <Loader2 className="size-4 animate-spin" />}
            Submit quiz
          </Button>
        )}
      </div>
    </div>
  );
}

function QuizResults({
  quiz,
  answers,
  onRetake,
}: {
  quiz: QuizWithQuestions;
  answers: Record<string, string>;
  onRetake: () => void;
}) {
  const questions = quiz.questions;
  const correctCount = questions.filter((q) => isCorrect(q, answers[q.id] ?? "")).length;
  const accuracy = Math.round((correctCount / questions.length) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
          <div className="text-4xl font-bold tracking-tight">{accuracy}%</div>
          <p className="text-muted-foreground">
            You scored <span className="font-medium text-foreground">{correctCount}/{questions.length}</span> on {quiz.title}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={onRetake}>
              <RotateCcw className="size-4" /> Retake
            </Button>
            <Button render={<Link href="/quizzes" />}>Back to quizzes</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {questions.map((q, i) => {
          const given = answers[q.id] ?? "";
          const ok = isCorrect(q, given);
          return (
            <Card key={q.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start gap-2">
                  {ok ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                  )}
                  <p className="font-medium">{i + 1}. {q.prompt}</p>
                </div>
                <div className="ml-7 space-y-1 text-sm">
                  <p className={cn(ok ? "text-success" : "text-destructive")}>
                    Your answer: {given || <span className="italic text-muted-foreground">blank</span>}
                  </p>
                  {!ok && <p className="text-success">Correct answer: {q.correct_answer}</p>}
                  {q.explanation && (
                    <div className="mt-1 rounded-lg bg-muted/50 p-2.5">
                      <Markdown className="text-xs">{q.explanation}</Markdown>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
