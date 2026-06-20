/**
 * SM-2 spaced repetition (SuperMemo 2), adapted to a 3-button UI
 * (Easy / Medium / Hard). Used by revisions now and flashcards later.
 *
 * Returns the next scheduling state given the previous state and the user's
 * self-rating. Quality mapping: hard→2, medium→4, easy→5.
 */
import type { RevisionRating } from "@/lib/constants";

export interface SrsState {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export interface SrsResult extends SrsState {
  next_review: string; // YYYY-MM-DD
}

const QUALITY: Record<RevisionRating, number> = {
  hard: 2,
  medium: 4,
  easy: 5,
};

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function schedule(prev: SrsState, rating: RevisionRating): SrsResult {
  const q = QUALITY[rating];

  // Failing-ish grade: reset the learning streak, review again tomorrow.
  if (q < 3) {
    return {
      interval_days: 1,
      repetitions: 0,
      ease_factor: Math.max(1.3, prev.ease_factor - 0.2),
      next_review: addDays(1),
    };
  }

  const ease_factor = Math.max(
    1.3,
    prev.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );
  const repetitions = prev.repetitions + 1;

  let interval_days: number;
  if (repetitions === 1) interval_days = 1;
  else if (repetitions === 2) interval_days = 6;
  else interval_days = Math.round(prev.interval_days * ease_factor);

  return {
    interval_days,
    ease_factor: Number(ease_factor.toFixed(2)),
    repetitions,
    next_review: addDays(interval_days),
  };
}

export const INITIAL_SRS: SrsState = {
  interval_days: 1,
  ease_factor: 2.5,
  repetitions: 0,
};
