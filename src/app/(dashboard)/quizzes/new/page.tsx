import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { QuizGenerator } from "@/components/quizzes/quiz-generator";

export const metadata: Metadata = { title: "Generate Quiz" };

export default function NewQuizPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="AI Quiz Generator"
        description="Generate board-style questions from your notes and test your recall."
      />
      <QuizGenerator />
    </div>
  );
}
