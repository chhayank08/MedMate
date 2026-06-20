"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { refreshSubjectAnalytics } from "@/lib/analytics";
import type { Quiz, Question, QuizWithQuestions, AttemptAnswer } from "@/types";
import type { Json } from "@/types/database.types";

const QUIZZES_KEY = ["quizzes"] as const;

export type QuizListItem = Quiz & {
  quiz_attempts: { accuracy: number; score: number; total: number; completed_at: string }[];
};

export function useQuizzes() {
  return useQuery({
    queryKey: QUIZZES_KEY,
    queryFn: async (): Promise<QuizListItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, quiz_attempts(accuracy, score, total, completed_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Embedded select; cast through unknown (typed client can't infer the join shape).
      return (data ?? []) as unknown as QuizListItem[];
    },
  });
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: ["quiz", id],
    enabled: !!id,
    queryFn: async (): Promise<QuizWithQuestions> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, questions(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      const quiz = data as unknown as Quiz & { questions: Question[] };
      quiz.questions = [...quiz.questions].sort((a, b) => a.position - b.position);
      return quiz;
    },
  });
}

export function useSaveAttempt() {
  const qc = useQueryClient();
  const { data: user } = useUser();
  return useMutation({
    mutationFn: async (args: {
      quiz: QuizWithQuestions;
      answers: AttemptAnswer[];
      timeTakenSec: number;
    }) => {
      const supabase = createClient();
      if (!user) throw new Error("Not authenticated");
      const { quiz, answers, timeTakenSec } = args;
      const score = answers.filter((a) => a.correct).length;
      const total = quiz.questions.length;
      const accuracy = total ? Math.round((score / total) * 10000) / 100 : 0;

      const { data: attempt, error } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          score,
          total,
          accuracy,
          time_taken_sec: timeTakenSec,
          answers: answers as unknown as Json,
        })
        .select()
        .single();
      if (error) throw error;

      // Log a study session so study-hours stats reflect quiz time.
      await supabase.from("study_sessions").insert({
        user_id: user.id,
        subject: quiz.subject,
        duration_minutes: Math.max(1, Math.round(timeTakenSec / 60)),
        source: "quiz",
      });

      await refreshSubjectAnalytics(supabase, user.id, quiz.subject);
      return attempt;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUIZZES_KEY });
    },
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUIZZES_KEY }),
  });
}
