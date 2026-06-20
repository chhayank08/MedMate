/**
 * Chunked, free-tier-safe summary generation.
 *
 * The old pipeline dumped the whole document into a single request with a huge
 * max_tokens, which truncated mid-output and tripped free-tier 402s. This module
 * keeps EVERY AI call small and assembles a complete result:
 *
 *  - Small material  → one bounded streaming pass (token-streamed for nice UX).
 *  - Large material  → MAP each section with a bounded call, then either
 *                      stream the per-section notes progressively ("concatenate"
 *                      types) or REDUCE the brief section notes into one short
 *                      output ("concise" types). Hierarchical reduce keeps the
 *                      reduce input bounded too.
 *
 * Output is yielded as a stream of strings (plus transient progress markers);
 * the route appends the success sentinel and pipes it to the client.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { SummaryType } from "@/lib/constants";
import { STREAM_PROGRESS_PREFIX, STREAM_PROGRESS_SUFFIX } from "@/lib/constants";
import { aiRouter } from "@/lib/ai/router";
import { estimateTokens } from "@/lib/ai/budget";
import { chunkText, type Chunk } from "@/lib/rag/chunk";
import { getSummaryProfile, type SummaryProfile } from "@/lib/ai/summary-profiles";
import {
  summaryMessages,
  summarySectionMessages,
  summaryReduceMessages,
} from "@/lib/ai/prompts";
import { AIError } from "@/lib/ai/providers/types";

/** Material at/under this many tokens is summarized in a single pass. */
const SINGLE_PASS_TOKEN_LIMIT = 4000;
/** Section size for the map step (tokens). Keeps each call free-tier safe. */
const SECTION_TOKENS = 2200;
const SECTION_OVERLAP = 80;
/** Cap on sections so a giant doc can't fan out into hundreds of calls. */
const MAX_SECTIONS = 20;
/** Max combined tokens of section notes fed to a single reduce call. */
const REDUCE_INPUT_LIMIT = 6000;
/** Output cap for intermediate (hierarchical) reduce passes. */
const COLLAPSE_MAX_TOKENS = 1500;

export interface SummarizeLargeInput {
  type: SummaryType;
  material: string | null | undefined;
  subject?: string | null;
  subjects?: string[] | null;
  customTopics?: string | null;
  academicContext?: string;
  log: { supabase: SupabaseClient<Database>; userId: string };
  signal?: AbortSignal;
}

function progress(msg: string): string {
  return `${STREAM_PROGRESS_PREFIX}${msg}${STREAM_PROGRESS_SUFFIX}`;
}

function combinedTokens(parts: string[]): number {
  return parts.reduce((n, p) => n + estimateTokens(p), 0);
}

/** Group consecutive notes so each group stays under a token budget. */
function groupByBudget(parts: string[], limitTokens: number): string[][] {
  const groups: string[][] = [];
  let cur: string[] = [];
  let curTokens = 0;
  for (const p of parts) {
    const t = estimateTokens(p);
    if (cur.length && curTokens + t > limitTokens) {
      groups.push(cur);
      cur = [];
      curTokens = 0;
    }
    cur.push(p);
    curTokens += t;
  }
  if (cur.length) groups.push(cur);
  return groups;
}

/** Merge oversized section lists into at most MAX_SECTIONS larger sections. */
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

/** One bounded streaming pass — used for small material and topic-only mode. */
async function* singlePassStream(
  input: SummarizeLargeInput,
  maxTokens: number,
): AsyncGenerator<string> {
  const { type, material, subject, subjects, customTopics, academicContext, log, signal } = input;
  const stream = await aiRouter.runStream({
    task: "summary",
    messages: summaryMessages(type, material, subject, subjects, customTopics, academicContext),
    temperature: 0.5,
    maxTokens,
    log,
    signal,
  });
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

/** Hierarchically collapse section notes until they fit one reduce call. */
async function collapse(input: SummarizeLargeInput, partials: string[]): Promise<string[]> {
  const { type, subject, subjects, customTopics, academicContext, log, signal } = input;
  let current = partials;
  let guard = 0;
  while (combinedTokens(current) > REDUCE_INPUT_LIMIT && current.length > 2 && guard < 3) {
    guard++;
    const groups = groupByBudget(current, REDUCE_INPUT_LIMIT);
    const next: string[] = [];
    for (const g of groups) {
      if (signal?.aborted) return next;
      const { text } = await aiRouter.run({
        task: "summary",
        messages: summaryReduceMessages(type, g, subject, subjects, customTopics, academicContext),
        temperature: 0.5,
        maxTokens: COLLAPSE_MAX_TOKENS,
        log,
        signal,
      });
      const clean = text.trim();
      if (clean) next.push(clean);
    }
    current = next.length ? next : current;
  }
  return current;
}

export async function* summarizeLarge(input: SummarizeLargeInput): AsyncGenerator<string> {
  const { type, material, subject, subjects, customTopics, academicContext, log, signal } = input;
  const profile: SummaryProfile = getSummaryProfile(type);
  const text = (material ?? "").trim();

  // No / small material → single bounded streaming pass.
  if (!text || estimateTokens(text) <= SINGLE_PASS_TOKEN_LIMIT) {
    yield* singlePassStream(input, profile.maxTokens);
    return;
  }

  // Large material → section it for the map step.
  let sections = chunkText(text, { maxTokens: SECTION_TOKENS, overlapTokens: SECTION_OVERLAP });
  if (sections.length > MAX_SECTIONS) sections = regroupSections(sections, MAX_SECTIONS);
  const total = sections.length;

  // MAP: summarize each section with a bounded call.
  const partials: string[] = [];
  let failed = 0;
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) return;
    yield progress(`Reading section ${i + 1} of ${total}…`);
    try {
      const { text: partial } = await aiRouter.run({
        task: "summary",
        messages: summarySectionMessages(
          type,
          sections[i].content,
          i + 1,
          total,
          subject,
          subjects,
          customTopics,
          academicContext,
        ),
        temperature: 0.5,
        maxTokens: profile.sectionMaxTokens,
        log,
        signal,
      });
      const clean = partial.trim();
      if (!clean) continue;
      partials.push(clean);
      // Coverage types stream their full per-section notes as they complete.
      if (profile.reduceMode === "concatenate") {
        yield (partials.length > 1 ? "\n\n" : "") + clean;
      }
    } catch (err) {
      failed++;
      // Concatenate types surface the gap inline (visible to the user), so the
      // result stays honest even though it completes. Concise types can't show
      // the gap — they're handled after the loop.
      if (profile.reduceMode === "concatenate") {
        const msg = err instanceof Error ? err.message : "generation error";
        yield `\n\n_(Section ${i + 1} of ${total} could not be generated: ${msg})_\n`;
      }
    }
  }

  if (partials.length === 0) {
    throw new AIError("Unable to generate summary. Please try again with different material or wait a moment.", 502, false, "bad_response");
  }

  // Concatenate types are already fully streamed above (gaps shown inline).
  if (profile.reduceMode === "concatenate") return;

  // Concise types compress the section notes, so a dropped section vanishes
  // silently. If a meaningful fraction failed, mark the result incomplete (the
  // route withholds the success sentinel → the client offers Retry) rather than
  // synthesizing lossy notes the user can't tell are missing content.
  if (failed > 0 && failed >= Math.ceil(total * 0.3)) {
    throw new AIError(
      `Generation incomplete: ${failed} of ${total} sections failed. Please retry.`,
      502,
      true,
      "outage",
    );
  }

  // REDUCE (concise types): collapse if needed, then stream the final output.
  yield progress("Synthesizing your notes…");
  const collapsed = await collapse(input, partials);
  yield* (async function* () {
    const stream = await aiRouter.runStream({
      task: "summary",
      messages: summaryReduceMessages(type, collapsed, subject, subjects, customTopics, academicContext),
      temperature: 0.5,
      maxTokens: profile.maxTokens,
      log,
      signal,
    });
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  })();
}
