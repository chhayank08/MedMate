import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { QuizGenerator } from "@/components/quizzes/quiz-generator";
import { GeneratorErrorBoundary } from "@/components/shared/generator-error-boundary";

export const metadata: Metadata = { title: "Generate Quiz" };

export default function NewQuizPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="AI Quiz Generator"
        description="Generate intelligent questions from your study materials and test your knowledge."
      />
      <GeneratorErrorBoundary fallbackTitle="Quiz Generator Error">
        <QuizGenerator />
      </GeneratorErrorBoundary>
    </div>
  );
}
