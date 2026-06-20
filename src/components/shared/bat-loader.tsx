"use client";

import { cn } from "@/lib/utils";
import { Reticle, Radar, SystemDot } from "@/components/shared/bat-sprites";

/**
 * Tactical loading messages keyed by task. Decorative copy only — the
 * underlying feature and request are unchanged.
 */
export const BAT_LOADING_MESSAGES = {
  quiz: "Analyzing study material…",
  summary: "Compiling intelligence…",
  flashcards: "Building memory database…",
  plan: "Calculating optimal study strategy…",
  file: "Scanning uploaded material…",
  page: "Initializing Batcomputer…",
} as const;

export type BatLoadingKey = keyof typeof BAT_LOADING_MESSAGES;

interface BatLoaderProps {
  message?: string;
  /** Compact inline variant (single row) for tight spaces. */
  inline?: boolean;
  className?: string;
}

/**
 * Batcomputer loading experience: a sweeping radar / targeting reticle.
 * Animations are CSS-only and pause under prefers-reduced-motion (see globals.css).
 */
export function BatLoader({ message = BAT_LOADING_MESSAGES.page, inline, className }: BatLoaderProps) {
  if (inline) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-primary", className)} role="status">
        <Radar className="bat-spin size-5" />
        <span className="bat-hud font-medium uppercase tracking-wider">{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-8 text-center", className)}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex size-16 items-center justify-center">
        <Reticle className="bat-spin-slow absolute size-16 text-primary/40" />
        <Radar className="bat-pulse size-9 text-primary" />
        <SystemDot className="bat-float absolute -right-1 top-0 size-3 text-primary/60" />
      </div>
      <p className="bat-hud text-sm font-semibold uppercase tracking-[0.18em] text-primary">{message}</p>
    </div>
  );
}
