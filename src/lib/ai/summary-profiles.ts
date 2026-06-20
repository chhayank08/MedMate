/**
 * Per-summary-type generation profiles.
 *
 * The old pipeline budgeted every summary the same way (task "summary": floor
 * 2500 / ceil 16000) regardless of type, so a "Quick Summary" and "Exam Notes"
 * requested the same enormous output — which (a) made the types feel identical
 * and (b) tripped free-tier 402s. Each type now carries:
 *
 *  - `kind`        : "text" (streamed Markdown) vs "flashcards" (batched JSON).
 *  - `maxTokens`   : free-safe cap for a single-pass call (small material) AND
 *                    for the final reduce pass. Differentiates output length.
 *  - `sectionMaxTokens` : free-safe cap for each per-section "map" call when a
 *                    large document is processed section-by-section.
 *  - `reduceMode`  : how section partials are combined for large documents —
 *                    "concise" synthesizes them into a short final output;
 *                    "concatenate" keeps full per-section coverage (long).
 *
 * Keeping every call small is what makes generation reliable on free APIs; the
 * map-reduce pipeline (summarize-large.ts) assembles complete output from them.
 */
import type { SummaryType } from "@/lib/constants";

export type ReduceMode = "concise" | "concatenate";

export interface SummaryProfile {
  kind: "text" | "flashcards";
  /** Output cap for a single-pass generation (small material) / reduce pass. */
  maxTokens: number;
  /** Output cap for each per-section map call (large material). */
  sectionMaxTokens: number;
  /** How section partials are merged for large documents. */
  reduceMode: ReduceMode;
}

/**
 * All values are well under the free-tier-safe ceiling so no single request can
 * trigger a 402. Concise types stay genuinely short; coverage types grow by
 * concatenating bounded per-section notes rather than one giant request.
 */
const PROFILES: Record<SummaryType, SummaryProfile> = {
  // Concise types — short final output, synthesized from brief section notes.
  quick: { kind: "text", maxTokens: 700, sectionMaxTokens: 400, reduceMode: "concise" },
  key_concepts: { kind: "text", maxTokens: 900, sectionMaxTokens: 500, reduceMode: "concise" },
  high_yield_points: { kind: "text", maxTokens: 900, sectionMaxTokens: 500, reduceMode: "concise" },
  one_page_summary: { kind: "text", maxTokens: 1200, sectionMaxTokens: 500, reduceMode: "concise" },

  // Coverage types — full per-section detail, concatenated for completeness.
  definitions: { kind: "text", maxTokens: 1500, sectionMaxTokens: 1000, reduceMode: "concatenate" },
  cheat_sheet: { kind: "text", maxTokens: 3500, sectionMaxTokens: 2800, reduceMode: "concatenate" },
  active_recall_notes: { kind: "text", maxTokens: 2500, sectionMaxTokens: 2000, reduceMode: "concatenate" },
  revision: { kind: "text", maxTokens: 3800, sectionMaxTokens: 3200, reduceMode: "concatenate" },  // Increased from 3200 to 3800
  exam_notes: { kind: "text", maxTokens: 3800, sectionMaxTokens: 3200, reduceMode: "concatenate" },

  // Flashcards use the batched-JSON pipeline; maxTokens caps each batch call.
  flashcards: { kind: "flashcards", maxTokens: 2000, sectionMaxTokens: 1600, reduceMode: "concatenate" },
};

export function getSummaryProfile(type: SummaryType): SummaryProfile {
  return PROFILES[type];
}
