import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { SummariesList } from "@/components/summaries/summaries-list";

export const metadata: Metadata = { title: "Summaries" };

export default function SummariesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Summaries" description="Your AI-generated study summaries.">
        <Button render={<Link href="/summaries/new" />}>
          <Plus className="size-4" /> New summary
        </Button>
      </PageHeader>
      <SummariesList />
    </div>
  );
}
