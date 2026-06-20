/**
 * Short-TTL response cache for generation requests. Its purpose is to dedupe
 * identical requests (double-submits, client retries, rapid refreshes) so they
 * don't re-bill the same tokens — NOT to serve stale study material long-term.
 * Keep TTLs short. Best-effort: failures never break a generation.
 */
import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { BudgetTask } from "@/lib/ai/budget";

export const DEFAULT_TTL_MS = 10 * 60_000; // 10 minutes

/** Stable cache key from the user + task + the request-defining inputs. */
export function cacheKey(userId: string, task: BudgetTask, payload: unknown): string {
  const json = JSON.stringify(payload);
  return createHash("sha256").update(`${userId}:${task}:${json}`).digest("hex");
}

export async function getCachedResponse<T>(
  supabase: SupabaseClient<Database>,
  key: string,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T | null> {
  try {
    const { data } = await supabase
      .from("ai_response_cache")
      .select("response, created_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (!data) return null;
    if (Date.now() - new Date(data.created_at).getTime() > ttlMs) return null;
    return data.response as T;
  } catch {
    return null;
  }
}

export async function putCachedResponse(
  supabase: SupabaseClient<Database>,
  key: string,
  userId: string,
  task: BudgetTask,
  response: unknown,
): Promise<void> {
  try {
    await supabase
      .from("ai_response_cache")
      .upsert(
        { cache_key: key, user_id: userId, task, response: response as Json },
        { onConflict: "cache_key" },
      );
  } catch {
    // Best-effort.
  }
}
