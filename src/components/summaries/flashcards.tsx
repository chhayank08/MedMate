"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Flashcard {
  q: string;
  a: string;
}

/** Serialize cards to the fixed Markdown format we persist in `summaries.content`. */
export function flashcardsToMarkdown(cards: Flashcard[]): string {
  return cards.map((c) => `**Q:** ${c.q}\n\n**A:** ${c.a}`).join("\n\n");
}

/** Parse persisted flashcard Markdown back into card objects (forgiving). */
export function parseFlashcardsMarkdown(content: string): Flashcard[] {
  const cards: Flashcard[] = [];
  let cur: Flashcard | null = null;
  let field: "q" | "a" | null = null;
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    const qm = line.match(/^\*\*Q:\*\*\s*(.*)$/i);
    const am = line.match(/^\*\*A:\*\*\s*(.*)$/i);
    if (qm) {
      if (cur && cur.q) cards.push({ q: cur.q.trim(), a: cur.a.trim() });
      cur = { q: qm[1], a: "" };
      field = "q";
    } else if (am && cur) {
      cur.a = am[1];
      field = "a";
    } else if (cur && field && line) {
      cur[field] += (cur[field] ? "\n" : "") + line;
    }
  }
  if (cur && cur.q) cards.push({ q: cur.q.trim(), a: cur.a.trim() });
  return cards.filter((c) => c.q && c.a);
}

/**
 * Interactive flashcard viewer: one card at a time, click / Space / Enter to
 * flip between question and answer, arrow keys (or buttons) to navigate.
 * Accessible and reduced-motion-safe.
 */
export function Flashcards({ cards, className }: { cards: Flashcard[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const total = cards.length;

  const go = useCallback(
    (delta: number) => {
      setShowAnswer(false);
      setIndex((i) => (i + delta + total) % total);
    },
    [total],
  );
  const flip = useCallback(() => setShowAnswer((s) => !s), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, flip]);

  if (total === 0) return null;
  const card = cards[index];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <button
        type="button"
        onClick={flip}
        aria-label={showAnswer ? "Show question" : "Show answer"}
        aria-pressed={showAnswer}
        className={cn(
          "flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-8 text-center",
          "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {showAnswer ? "Answer" : "Question"}
        </span>
        <p aria-live="polite" className="whitespace-pre-wrap text-base font-medium leading-relaxed">
          {showAnswer ? card.a : card.q}
        </p>
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <RotateCw className="size-3" /> Tap to flip
        </span>
      </button>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => go(-1)} disabled={total < 2}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {index + 1} / {total}
        </span>
        <Button variant="outline" size="sm" onClick={() => go(1)} disabled={total < 2}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
