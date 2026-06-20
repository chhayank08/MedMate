import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/quizzes/quiz-runner";
import { PageHeader } from "@/components/shared/page-header";
import type { QuizWithQuestions } from "@/types";

export const metadata: Metadata = { title: "Take Quiz" };

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("quizzes")
    .select("*, questions(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const quiz = data as unknown as QuizWithQuestions;
  quiz.questions = [...quiz.questions].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <PageHeader
        title={quiz.title}
        description={[quiz.subject, `${quiz.difficulty} · ${quiz.num_questions} questions`]
          .filter(Boolean)
          .join(" · ")}
      />
      <QuizRunner quiz={quiz} />
    </div>
  );
}
