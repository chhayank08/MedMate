/**
 * RAG retrieval: embed a query, find the most similar stored chunks via the
 * `match_document_chunks` RPC, and assemble a bounded context block.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { embedOne } from "@/lib/ai/embeddings";

export interface RetrieveInput {
  supabase: SupabaseClient<Database>;
  userId: string;
  query: string;
  k?: number;
  docId?: string | null;
  /** Max characters of joined context (≈ maxChars/4 tokens). */
  maxChars?: number;
}

export interface RetrieveResult {
  context: string;
  chunkIds: string[];
  count: number;
}

export async function retrieveContext(input: RetrieveInput): Promise<RetrieveResult> {
  const { supabase, userId, query, k = 6, docId = null, maxChars = 8000 } = input;

  const queryEmbedding = await embedOne(supabase, query);
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_user: userId,
    match_count: k,
    doc_id: docId,
  });
  if (error) throw error;

  const rows = data ?? [];
  const parts: string[] = [];
  const chunkIds: string[] = [];
  let total = 0;
  for (const row of rows) {
    if (total + row.content.length > maxChars && parts.length > 0) break;
    parts.push(row.content);
    chunkIds.push(row.id);
    total += row.content.length;
  }

  return {
    context: parts.join("\n\n---\n\n"),
    chunkIds,
    count: parts.length,
  };
}
