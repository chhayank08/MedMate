"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Markdown } from "@/components/shared/markdown";
import { Flashcards, parseFlashcardsMarkdown } from "@/components/summaries/flashcards";
import { EmptyState } from "@/components/shared/empty-state";
import { useSummaries, useDeleteSummary } from "@/hooks/use-summaries";
import { SUMMARY_TYPE_META } from "@/lib/constants";
import { formatDate, clampText } from "@/lib/utils";
import type { Summary } from "@/types";

export function SummariesList() {
  const { data: summaries = [], isLoading } = useSummaries();
  const del = useDeleteSummary();
  const [active, setActive] = useState<Summary | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!summaries.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No summaries yet"
        description="Generate your first AI summary from your notes."
        action={
          <Button render={<Link href="/summaries/new" />}>
            <Plus className="size-4" /> New summary
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((s) => (
          <Card key={s.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug">{s.title}</CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="icon-sm" aria-label="Delete" />}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete summary?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() =>
                          del.mutate(s.id, {
                            onSuccess: () => toast.success("Deleted"),
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
                <Badge variant="secondary">{SUMMARY_TYPE_META[s.type].label}</Badge>
                {s.subject && <Badge variant="outline">{s.subject}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-3">
              <p className="text-sm text-muted-foreground">{clampText(s.content.replace(/[#*`>-]/g, ""), 140)}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(s.created_at)}</span>
                <Button variant="outline" size="sm" onClick={() => setActive(s)}>
                  Read
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          {active &&
            (active.type === "flashcards" ? (
              <Flashcards cards={parseFlashcardsMarkdown(active.content)} />
            ) : (
              <Markdown>{active.content}</Markdown>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
