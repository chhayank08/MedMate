/**
 * Resolve the study material a generator (quiz/summary) should actually see.
 *
 * - Small pasted notes → passed through unchanged (cheap, no embedding cost).
 * - A pre-indexed `documentId` → retrieve the most relevant chunks.
 * - A large raw `sourceText` → index it once, then retrieve relevant chunks.
 *
 * This is the transparent RAG seam: callers keep passing "source material" to
 * the existing prompt builders; large inputs are silently chunked + retrieved
 * instead of being dumped whole into the prompt (which caused 402s and cost).
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { indexDocument } from "@/lib/rag/index-document";
import { retrieveContext } from "@/lib/rag/retrieve";

/** Above this many characters, RAG (chunk + retrieve) beats a raw dump. */
export const RAG_CHAR_THRESHOLD = 8000;

export interface ResolveSourceInput {
  supabase: SupabaseClient<Database>;
  userId: string;
  sourceText?: string | null;
  subject?: string | null;
  documentId?: string | null;
  title?: string | null;
  /**
   * "retrieve" (default): RAG top-k — best for quizzes / Q&A over large docs.
   * "full": feed the ENTIRE document — required for summaries so no section is
   * dropped. Gemini Flash's 1M-token window comfortably holds it.
   */
  coverage?: "retrieve" | "full";
}

export interface ResolveSourceResult {
  /** The material to feed the prompt builder (RAG context or the raw text). */
  material: string | null;
  ragUsed: boolean;
  chunkCount: number;
}

function retrievalQuery(subject?: string | null): string {
  return subject && subject.trim()
    ? `Most important, high-yield, exam-relevant concepts about ${subject}.`
    : "Most important, high-yield, exam-relevant concepts in this material.";
}

/** Reassemble the full text of an indexed document from its stored chunks. */
async function getFullDocumentText(
  supabase: SupabaseClient<Database>,
  userId: string,
  docId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("document_chunks")
    .select("content")
    .eq("document_id", docId)
    .eq("user_id", userId)
    .order("chunk_index", { ascending: true });
  if (error || !data) return "";
  return data.map((r) => r.content).join("\n");
}

export async function resolveStudyMaterial(
  input: ResolveSourceInput,
): Promise<ResolveSourceResult> {
  const { supabase, userId, sourceText, subject, documentId, title, coverage = "retrieve" } = input;

  // Full-coverage mode (summaries): never reduce the material — feed it whole so
  // every section/heading/topic is represented in the output.
  if (coverage === "full") {
    if (documentId) {
      const full = await getFullDocumentText(supabase, userId, documentId);
      return { material: full || sourceText || null, ragUsed: false, chunkCount: 0 };
    }
    return { material: sourceText ?? null, ragUsed: false, chunkCount: 0 };
  }

  // 1) Already-indexed upload → retrieve directly.
  if (documentId) {
    const r = await retrieveContext({
      supabase,
      userId,
      query: retrievalQuery(subject),
      docId: documentId,
    });
    return { material: r.context || sourceText || null, ragUsed: r.count > 0, chunkCount: r.count };
  }

  // 2) No / small source → pass through unchanged.
  const text = sourceText?.trim() ?? "";
  if (text.length < RAG_CHAR_THRESHOLD) {
    return { material: sourceText ?? null, ragUsed: false, chunkCount: 0 };
  }

  // 3) Large pasted source → index once, then retrieve relevant chunks.
  try {
    const { documentId: docId } = await indexDocument({
      supabase,
      userId,
      title: title || subject || "Study material",
      text,
      sourceType: "paste",
    });
    const r = await retrieveContext({
      supabase,
      userId,
      query: retrievalQuery(subject),
      docId,
    });
    if (r.count > 0) return { material: r.context, ragUsed: true, chunkCount: r.count };
  } catch {
    // Embeddings unavailable / indexing failed → fall back to raw text below.
  }
  return { material: sourceText ?? null, ragUsed: false, chunkCount: 0 };
}
