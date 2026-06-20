import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { QuizzesList } from "@/components/quizzes/quizzes-list";

export const metadata: Metadata = { title: "Quizzes" };

export default function QuizzesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quizzes" description="Your generated quizzes and scores.">
        <Button render={<Link href="/quizzes/new" />}>
          <Plus className="size-4" /> New quiz
        </Button>
      </PageHeader>
      <QuizzesList />
    </div>
  );
}
