/**
 * Token budgeting. Replaces the old hardcoded `max_tokens` (quiz 4000, plan
 * 6000, summary 2500) that triggered OpenRouter 402s. Output size now scales
 * with input size, per task, and is clamped to stay within the model's context
 * window with margin.
 *
 * Heuristic: ~4 characters per token (good enough for English/medical prose;
 * actual provider usage is logged separately for cost accuracy).
 */
import type { ChatMessage } from "@/lib/ai/providers/types";

const CHARS_PER_TOKEN = 4;

/**
 * Hard cap on output tokens for any single request routed through a free-tier
 * provider (notably OpenRouter free models, which 402 when a request's
 * max_tokens exceeds the affordable credit). The router clamps to this for the
 * OpenRouter candidate so a fallback never asks for more than free can serve.
 */
export const FREE_TIER_MAX_OUTPUT = 4000;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function messagesTokens(messages: ChatMessage[]): number {
  return messages.reduce((n, m) => n + estimateTokens(m.content), 0);
}

/** Logical task → its output-size profile. */
export type BudgetTask =
  | "quiz"
  | "summary"
  | "flashcards"
  | "plan"
  | "medical_reasoning"
  | "extract_schedule"
  | "coach"
  | "vision"
  | "ocr"
  | "image_parse"
  | "embedding";

/**
 * Per-task output bands. `floor`/`ceil` bound the dynamic value; `perInputK`
 * lets output grow ~linearly with input (e.g. more source ⇒ more quiz items),
 * while staying well under the old fixed ceilings.
 */
interface BudgetProfile {
  floor: number;
  ceil: number;
  perInputK: number; // output tokens added per 1k input tokens
}

const PROFILES: Record<BudgetTask, BudgetProfile> = {
  // Quiz: each MCQ question needs ~250 tokens; 10q≈2500, 30q≈7500. Use high floor.
  quiz: { floor: 3000, ceil: 12000, perInputK: 400 },
  // Summary: callers now pass an explicit per-type maxTokens (see
  // summary-profiles.ts) and large docs are processed section-by-section via
  // the map-reduce pipeline, so this band is only a free-safe fallback.
  summary: { floor: 800, ceil: 3000, perInputK: 200 },
  // Flashcards: 15-30 structured Q&A pairs as JSON.
  flashcards: { floor: 3000, ceil: 12000, perInputK: 400 },
  // Plan: day-by-day JSON with many blocks; easily 4k-8k tokens.
  plan: { floor: 4000, ceil: 10000, perInputK: 100 },
  medical_reasoning: { floor: 800, ceil: 3000, perInputK: 100 },
  extract_schedule: { floor: 300, ceil: 1500, perInputK: 60 },
  coach: { floor: 400, ceil: 1200, perInputK: 40 },
  // Vision tasks: OCR and image parsing, typically moderate output
  vision: { floor: 500, ceil: 2000, perInputK: 50 },
  ocr: { floor: 500, ceil: 2000, perInputK: 50 },
  image_parse: { floor: 500, ceil: 2000, perInputK: 50 },
  // Embeddings: not used for output (handled by provider directly)
  embedding: { floor: 0, ceil: 0, perInputK: 0 },
};

/** Approximate usable context window per model family (tokens). */
function contextWindow(model: string): number {
  const m = model.toLowerCase();
  if (m.includes("gemini")) return 1_000_000;
  if (m.includes("claude")) return 200_000;
  if (m.includes("gpt-4.1") || m.includes("gpt-4o")) return 128_000;
  return 128_000; // conservative default
}

/**
 * Compute a safe `max_tokens` for a request.
 * - Scales output with the input size per the task profile.
 * - Clamps so `input + output + margin` never exceeds the context window.
 */
export function outputBudget(
  task: BudgetTask,
  inputTokens: number,
  model: string,
): number {
  const p = PROFILES[task];
  const scaled = p.floor + Math.round((inputTokens / 1000) * p.perInputK);
  const desired = Math.min(p.ceil, Math.max(p.floor, scaled));

  const window = contextWindow(model);
  const margin = 1000;
  const room = Math.max(256, window - inputTokens - margin);
  return Math.min(desired, room);
}
