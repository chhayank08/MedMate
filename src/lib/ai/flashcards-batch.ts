/**
 * Batched flashcard generation.
 *
 * The old path asked for 15–30 cards in ONE request with max_tokens 12000 —
 * which 402'd on free tiers and lost the entire set when the JSON truncated.
 * Here cards are generated in small batches (free-tier safe); a failed batch
 * never kills the whole set, large documents are covered section-by-section,
 * and answers are kept short so cards stay flashcards (not mini-summaries).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { aiRouter } from "@/lib/ai/router";
import { estimateTokens } from "@/lib/ai/budget";
import { chunkText, type Chunk } from "@/lib/rag/chunk";
import { flashcardBatchMessages } from "@/lib/ai/prompts";
import { getSummaryProfile } from "@/lib/ai/summary-profiles";
import { generatedFlashcardsSchema, type GeneratedFlashcard } from "@/lib/validations/ai";
import { AIError } from "@/lib/ai/providers/types";

const TARGET_CARDS = 24;
const BATCH_SIZE = 8;
const CARDS_PER_SECTION = 6;
const SMALL_DOC_TOKENS = 4000;
const SECTION_TOKENS = 2200;
const SECTION_OVERLAP = 80;
const MAX_SECTIONS = 6;

export interface FlashcardsInput {
  material: string | null | undefined;
  subject?: string | null;
  subjects?: string[] | null;
  customTopics?: string | null;
  academicContext?: string;
  log: { supabase: SupabaseClient<Database>; userId: string };
  signal?: AbortSignal;
}

function deriveTitle(input: FlashcardsInput): string {
  const subj = input.subjects?.[0] ?? input.subject ?? input.customTopics?.trim();
  return subj ? `${subj} — Flashcards` : "Flashcards";
}

/** Keep answers short so cards remain flashcards, not paragraphs. */
function trimAnswer(a: string): string {
  const t = a.trim();
  if (t.length <= 320) return t;
  const sentences = t.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 2) return sentences.slice(0, 2).join(" ").trim();
  return `${t.slice(0, 320).trim()}…`;
}

function regroupSections(sections: Chunk[], maxGroups: number): Chunk[] {
  const perGroup = Math.ceil(sections.length / maxGroups);
  const out: Chunk[] = [];
  for (let i = 0; i < sections.length; i += perGroup) {
    const slice = sections.slice(i, i + perGroup);
    out.push({
      index: out.length,
      content: slice.map((s) => s.content).join("\n\n"),
      tokenCount: slice.reduce((n, s) => n + s.tokenCount, 0),
    });
  }
  return out;
}

/** Generate one batch; returns [] (never throws) so one failure can't end the run. */
async function genBatch(
  input: FlashcardsInput,
  material: string | null,
  count: number,
  avoid: string[],
): Promise<{ title: string; cards: GeneratedFlashcard[] }> {
  try {
    const profile = getSummaryProfile("flashcards");
    const { data } = await aiRouter.runObject(
      {
        task: "flashcards",
        messages: flashcardBatchMessages(
          material,
          count,
          avoid,
          input.subject,
          input.subjects,
          input.customTopics,
          input.academicContext,
        ),
        temperature: 0.5,
        maxTokens: profile.maxTokens,
        log: input.log,
        signal: input.signal,
      },
      generatedFlashcardsSchema,
    );
    return { title: data.title, cards: data.cards };
  } catch {
    return { title: "", cards: [] };
  }
}

export async function generateFlashcards(
  input: FlashcardsInput,
): Promise<{ title: string; cards: GeneratedFlashcard[] }> {
  const text = (input.material ?? "").trim();
  const seen = new Set<string>();
  const cards: GeneratedFlashcard[] = [];
  let title = "";

  const addCards = (batch: GeneratedFlashcard[]): number => {
    let added = 0;
    for (const c of batch) {
      if (cards.length >= TARGET_CARDS) break;
      const key = c.q.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      cards.push({ q: c.q.trim(), a: trimAnswer(c.a) });
      added++;
    }
    return added;
  };
  const avoidList = (): string[] => cards.slice(-40).map((c) => c.q);

  if (!text || estimateTokens(text) <= SMALL_DOC_TOKENS) {
    // Small material (or topic-only) → a few batches over the same source.
    while (cards.length < TARGET_CARDS) {
      if (input.signal?.aborted) break;
      const count = Math.min(BATCH_SIZE, TARGET_CARDS - cards.length);
      const { title: t, cards: batch } = await genBatch(input, text || null, count, avoidList());
      if (!title && t) title = t;
      if (addCards(batch) === 0) break; // no new unique cards → stop (avoid loops)
    }
  } else {
    // Large material → cover it section-by-section.
    let sections = chunkText(text, { maxTokens: SECTION_TOKENS, overlapTokens: SECTION_OVERLAP });
    if (sections.length > MAX_SECTIONS) sections = regroupSections(sections, MAX_SECTIONS);
    for (const s of sections) {
      if (input.signal?.aborted || cards.length >= TARGET_CARDS) break;
      const { title: t, cards: batch } = await genBatch(input, s.content, CARDS_PER_SECTION, avoidList());
      if (!title && t) title = t;
      addCards(batch);
    }
  }

  if (cards.length === 0) {
    throw new AIError("Unable to generate flashcards from the provided material. Please try different content or a different subject.", 502, false, "bad_response");
  }
  return { title: title || deriveTitle(input), cards };
}
