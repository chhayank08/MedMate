/**
 * Batched quiz generation.
 *
 * The old path asked for all N questions in ONE request with max_tokens up to
 * 12 000 — which truncated into invalid JSON ("Unterminated string in JSON")
 * whenever it fell back to a free model (clamped to 4 000) and lost the whole
 * quiz. Here questions are generated in small batches (free-tier safe); a failed
 * batch never kills the set, and large documents are covered section-by-section
 * so EVERY part of the input informs the quiz (not just top-k retrieval).
 *
 * Mirrors `flashcards-batch.ts`.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Difficulty, QuestionType } from "@/lib/constants";
import { aiRouter } from "@/lib/ai/router";
import { estimateTokens } from "@/lib/ai/budget";
import { chunkText, type Chunk } from "@/lib/rag/chunk";
import { quizBatchMessages } from "@/lib/ai/prompts";
import { generatedQuizSchema, type GeneratedQuestion } from "@/lib/validations/ai";
import { AIError } from "@/lib/ai/providers/types";

/** Questions per call. ~280 tokens/question + overhead keeps each batch's JSON
 *  well under the free-tier output clamp (4 000) so it never truncates. */
const BATCH_SIZE = 6;
const PER_QUESTION_TOKENS = 280;
const BATCH_OVERHEAD = 500;
const SMALL_DOC_TOKENS = 3500;
const SECTION_TOKENS = 1800;
const SECTION_OVERLAP = 100;
const MAX_SECTIONS = 8;

export interface QuizBatchInput {
  material: string | null | undefined;
  subject?: string | null;
  subjects?: string[] | null;
  customTopics?: string | null;
  difficulty: Difficulty;
  numQuestions: number;
  types: QuestionType[];
  academicContext?: string;
  log: { supabase: SupabaseClient<Database>; userId: string };
  signal?: AbortSignal;
}

function deriveTitle(input: QuizBatchInput): string {
  const subj = input.subjects?.[0] ?? input.subject ?? input.customTopics?.trim();
  return subj ? `${subj} — Quiz` : "Quiz";
}

function batchMaxTokens(count: number): number {
  return Math.min(4000, count * PER_QUESTION_TOKENS + BATCH_OVERHEAD);
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

/** Generate one batch; returns empty (never throws) so one failure can't end the run. */
async function genBatch(
  input: QuizBatchInput,
  material: string | null,
  count: number,
  avoid: string[],
): Promise<{ title: string; questions: GeneratedQuestion[]; model: string | null }> {
  try {
    const { data, result } = await aiRouter.runObject(
      {
        task: "quiz",
        messages: quizBatchMessages({
          sourceText: material,
          subject: input.subject,
          subjects: input.subjects,
          customTopics: input.customTopics,
          difficulty: input.difficulty,
          count,
          types: input.types,
          avoidPrompts: avoid,
          academicContext: input.academicContext,
        }),
        temperature: 0.5,
        maxTokens: batchMaxTokens(count),
        log: input.log,
        signal: input.signal,
      },
      generatedQuizSchema,
    );
    return { title: data.title, questions: data.questions, model: result.model ?? null };
  } catch {
    return { title: "", questions: [], model: null };
  }
}

export async function generateQuiz(
  input: QuizBatchInput,
): Promise<{ title: string; questions: GeneratedQuestion[]; model: string | null }> {
  const text = (input.material ?? "").trim();
  const target = input.numQuestions;
  const seen = new Set<string>();
  const questions: GeneratedQuestion[] = [];
  let title = "";
  let model: string | null = null;

  const addQuestions = (batch: GeneratedQuestion[]): number => {
    let added = 0;
    for (const q of batch) {
      if (questions.length >= target) break;
      const key = q.prompt.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      questions.push(q);
      added++;
    }
    return added;
  };
  const avoidList = (): string[] => questions.slice(-40).map((q) => q.prompt);
  const note = (m: string | null) => {
    if (!model && m) model = m;
  };

  if (!text || estimateTokens(text) <= SMALL_DOC_TOKENS) {
    // Small material (or topic-only) → a few batches over the same source.
    while (questions.length < target) {
      if (input.signal?.aborted) break;
      const count = Math.min(BATCH_SIZE, target - questions.length);
      const { title: t, questions: batch, model: m } = await genBatch(input, text || null, count, avoidList());
      note(m);
      if (!title && t) title = t;
      if (addQuestions(batch) === 0) break; // no new unique questions → stop (avoid loops)
    }
  } else {
    // Large material → cover it section-by-section so all input is used.
    let sections = chunkText(text, { maxTokens: SECTION_TOKENS, overlapTokens: SECTION_OVERLAP });
    if (sections.length > MAX_SECTIONS) sections = regroupSections(sections, MAX_SECTIONS);
    const perSection = Math.max(1, Math.ceil(target / sections.length));
    for (const s of sections) {
      if (input.signal?.aborted || questions.length >= target) break;
      const count = Math.min(BATCH_SIZE, perSection, target - questions.length);
      const { title: t, questions: batch, model: m } = await genBatch(input, s.content, count, avoidList());
      note(m);
      if (!title && t) title = t;
      addQuestions(batch);
    }
    // Dropped batches may leave us short → top up from the full breadth.
    while (questions.length < target) {
      if (input.signal?.aborted) break;
      const count = Math.min(BATCH_SIZE, target - questions.length);
      const { questions: batch, model: m } = await genBatch(input, text, count, avoidList());
      note(m);
      if (addQuestions(batch) === 0) break;
    }
  }

  if (questions.length === 0) {
    throw new AIError("Could not generate quiz questions. Please try again.", 502, false, "bad_response");
  }
  return { title: title || deriveTitle(input), questions, model };
}
