import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SummaryGenerator } from "@/components/summaries/summary-generator";
import { GeneratorErrorBoundary } from "@/components/shared/generator-error-boundary";

export const metadata: Metadata = { title: "Generate Summary" };

export default function NewSummaryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Summary Generator"
        description="Transform your study materials into concise summaries, revision notes, flashcards and more."
      />
      <GeneratorErrorBoundary fallbackTitle="Summary Generator Error">
        <SummaryGenerator />
      </GeneratorErrorBoundary>
    </div>
  );
}
