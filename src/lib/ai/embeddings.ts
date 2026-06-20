/**
 * Gemini embeddings with a content-hash cache. Every distinct piece of text is
 * embedded exactly once: hits are served from `embedding_cache`, misses are
 * embedded in batch and written back. Returns pgvector literals ("[v1,v2,…]")
 * so the values can go straight into `vector` columns and RPC arguments without
 * an extra parse/format round-trip.
 */
import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { geminiProvider, GEMINI_EMBED_MODEL } from "@/lib/ai/providers/gemini";
import { AIError } from "@/lib/ai/providers/types";

export const EMBED_DIMENSIONS = 768;
const BATCH_SIZE = 100; // Gemini batchEmbedContents limit per request.

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** pgvector text literal for a numeric vector. */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

async function embedRaw(texts: string[]): Promise<string[]> {
  if (!geminiProvider.available() || !geminiProvider.embed) {
    throw new AIError(
      "Embeddings require GEMINI_API_KEY (Gemini gemini-embedding-001).",
      500,
      false,
      "config",
    );
  }
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const vectors = await geminiProvider.embed(batch, GEMINI_EMBED_MODEL);
    for (const v of vectors) out.push(toVectorLiteral(v));
  }
  return out;
}

/**
 * Embed `texts`, reusing cached vectors by content hash. Returns the embeddings
 * as pgvector literals, in the same order as the input.
 */
export async function embedTexts(
  supabase: SupabaseClient<Database>,
  texts: string[],
): Promise<string[]> {
  if (texts.length === 0) return [];

  const hashes = texts.map(sha256);
  const uniqueHashes = Array.from(new Set(hashes));

  // 1) Look up cache.
  const cache = new Map<string, string>();
  const { data: cached } = await supabase
    .from("embedding_cache")
    .select("content_hash, embedding")
    .in("content_hash", uniqueHashes);
  for (const row of cached ?? []) cache.set(row.content_hash, row.embedding);

  // 2) Embed misses (dedup identical text within the batch too).
  const missByHash = new Map<string, string>();
  for (let i = 0; i < texts.length; i++) {
    if (!cache.has(hashes[i]) && !missByHash.has(hashes[i])) {
      missByHash.set(hashes[i], texts[i]);
    }
  }
  if (missByHash.size > 0) {
    const missHashes = Array.from(missByHash.keys());
    const missTexts = missHashes.map((h) => missByHash.get(h)!);
    const vectors = await embedRaw(missTexts);
    const rows = missHashes.map((h, i) => ({
      content_hash: h,
      embedding: vectors[i],
      model: GEMINI_EMBED_MODEL,
    }));
    // Best-effort cache write; ignore unique-violation races.
    await supabase.from("embedding_cache").upsert(rows, { onConflict: "content_hash" });
    for (let i = 0; i < missHashes.length; i++) cache.set(missHashes[i], vectors[i]);
  }

  // 3) Reassemble in input order.
  return hashes.map((h) => cache.get(h)!);
}

/** Convenience for a single string (e.g. a retrieval query). */
export async function embedOne(
  supabase: SupabaseClient<Database>,
  text: string,
): Promise<string> {
  const [vec] = await embedTexts(supabase, [text]);
  return vec;
}
