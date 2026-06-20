/**
 * Index a source document for RAG: persist a `documents` row, chunk the text,
 * embed each chunk (cached), and store chunks + embeddings in `document_chunks`.
 *
 * Idempotent per (user, content): identical text already indexed is reused, so
 * re-uploading the same notes/PDF never re-embeds.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts, sha256 } from "@/lib/ai/embeddings";

export interface IndexDocumentInput {
  supabase: SupabaseClient<Database>;
  userId: string;
  title: string;
  text: string;
  sourceType?: "upload" | "paste" | "crawl";
  noteId?: string | null;
  filePath?: string | null;
  fileType?: string | null;
}

export interface IndexDocumentResult {
  documentId: string;
  chunkCount: number;
  reused: boolean;
}

export async function indexDocument(input: IndexDocumentInput): Promise<IndexDocumentResult> {
  const { supabase, userId, title, text } = input;
  const trimmed = text.trim();
  const contentHash = sha256(trimmed);

  // Idempotency: reuse an already-indexed identical document.
  const { data: existing } = await supabase
    .from("documents")
    .select("id")
    .eq("user_id", userId)
    .eq("content_hash", contentHash)
    .eq("status", "ready")
    .maybeSingle();
  if (existing?.id) {
    const { count } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", existing.id);
    return { documentId: existing.id, chunkCount: count ?? 0, reused: true };
  }

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      note_id: input.noteId ?? null,
      title,
      source_type: input.sourceType ?? "upload",
      file_path: input.filePath ?? null,
      file_type: input.fileType ?? null,
      char_count: trimmed.length,
      status: "pending",
      content_hash: contentHash,
    })
    .select("id")
    .single();
  if (docErr) throw docErr;

  try {
    const chunks = chunkText(trimmed);
    const embeddings = await embedTexts(
      supabase,
      chunks.map((c) => c.content),
    );
    const rows = chunks.map((c, i) => ({
      document_id: doc.id,
      user_id: userId,
      chunk_index: c.index,
      content: c.content,
      token_count: c.tokenCount,
      embedding: embeddings[i],
    }));
    if (rows.length > 0) {
      const { error: chunkErr } = await supabase.from("document_chunks").insert(rows);
      if (chunkErr) throw chunkErr;
    }

    await supabase.from("documents").update({ status: "ready" }).eq("id", doc.id);
    return { documentId: doc.id, chunkCount: rows.length, reused: false };
  } catch (err) {
    await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
    throw err;
  }
}
