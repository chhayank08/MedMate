"use client";

import { useState } from "react";
import { Brain, Plus, Trash2, CalendarClock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { isPast, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useRevisions,
  useAddRevision,
  useRateRevision,
  useDeleteRevision,
} from "@/hooks/use-revisions";
import { MEDICAL_SUBJECTS, REVISION_RATING } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Revision } from "@/types";
import type { RevisionRating } from "@/lib/constants";

const RATING_STYLES: Record<RevisionRating, string> = {
  hard: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  medium: "bg-warning/15 text-warning hover:bg-warning/25",
  easy: "bg-success/15 text-success hover:bg-success/25",
};

export function RevisionPanel() {
  const { data: revisions = [], isLoading } = useRevisions();
  const add = useAddRevision();
  const rate = useRateRevision();
  const del = useDeleteRevision();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  const due = revisions.filter((r) => isToday(new Date(r.next_review)) || isPast(new Date(r.next_review)));
  const upcoming = revisions.filter((r) => !isToday(new Date(r.next_review)) && !isPast(new Date(r.next_review)));

  function submit() {
    if (!subject.trim()) return toast.error("Enter a subject to revise.");
    add.mutate(
      { subject: subject.trim(), topic: topic.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Added to your revision queue.");
          setSubject("");
          setTopic("");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  }

  function onRate(revision: Revision, rating: RevisionRating) {
    rate.mutate(
      { revision, rating },
      {
        onSuccess: () => toast.success("Scheduled next review."),
        onError: (e) => toast.error(e.message),
      },
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a topic to revise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              list="medmate-subjects"
              placeholder="Subject (e.g. Neuroanatomy)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <datalist id="medmate-subjects">
              {MEDICAL_SUBJECTS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <Input placeholder="Topic (optional, e.g. Brainstem nuclei)" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <Button onClick={submit} disabled={add.isPending} className="w-full">
              <Plus className="size-4" /> Add to queue
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4.5 text-chart-2" /> Upcoming reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : upcoming.length ? (
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.subject}</p>
                      {r.topic && <p className="truncate text-xs text-muted-foreground">{r.topic}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatDate(r.next_review)}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => del.mutate(r.id)} aria-label="Remove">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing scheduled ahead yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="size-4.5 text-primary" /> Due for review
            {due.length > 0 && <Badge variant="secondary">{due.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : due.length ? (
            <div className="space-y-3">
              {due.map((r) => (
                <div key={r.id} className="rounded-lg border p-3">
                  <div className="mb-2">
                    <p className="font-medium">{r.subject}</p>
                    {r.topic && <p className="text-sm text-muted-foreground">{r.topic}</p>}
                  </div>
                  <p className="mb-1.5 text-xs text-muted-foreground">How well did you recall this?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {REVISION_RATING.map((rating) => (
                      <Button
                        key={rating}
                        size="sm"
                        variant="ghost"
                        className={RATING_STYLES[rating]}
                        disabled={rate.isPending}
                        onClick={() => onRate(r, rating)}
                      >
                        {rating[0].toUpperCase() + rating.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="All caught up!"
              description="No reviews due right now. Add topics or check back later."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
