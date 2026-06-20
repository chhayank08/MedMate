"use client";

import { cn } from "@/lib/utils";
import { KittyFace, Heart, Star } from "@/components/shared/hk-sprites";

/**
 * Playful loading messages keyed by task. The character names appear in copy
 * only (no trademarked artwork is used).
 */
export const HK_LOADING_MESSAGES = {
  quiz: "Kuromi is creating your quiz…",
  summary: "My Melody is preparing your summary…",
  flashcards: "Cinnamoroll is building your flashcards…",
  plan: "Pompompurin is planning your study schedule…",
  file: "Hello Kitty is organizing your notes…",
  page: "Hello Kitty is getting things ready…",
} as const;

export type HKLoadingKey = keyof typeof HK_LOADING_MESSAGES;

interface HKLoaderProps {
  message?: string;
  /** Compact inline variant (single row) for tight spaces. */
  inline?: boolean;
  className?: string;
}

/**
 * Hello Kitty loading experience: a bouncing kitty with floating hearts/stars.
 * Animations are CSS-only and pause under prefers-reduced-motion (see globals.css).
 */
export function HKLoader({ message = HK_LOADING_MESSAGES.page, inline, className }: HKLoaderProps) {
  if (inline) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-primary", className)} role="status">
        <KittyFace className="hk-bounce size-6" />
        <span className="font-medium">{message}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-8 text-center", className)}
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <KittyFace className="hk-bounce size-14" />
        <Heart className="hk-float absolute -left-5 top-1 size-3.5" />
        <Star className="hk-float-slow absolute -right-5 top-2 size-3" />
        <Heart className="hk-float-slow absolute -right-3 -bottom-1 size-2.5" />
      </div>
      <p className="hk-display text-sm font-semibold text-primary">{message}</p>
    </div>
  );
}
